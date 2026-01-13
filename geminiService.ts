
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { ThesisAnalysis, AnalysisMode } from "./types";

// Lazy initialization to prevent crash on load if env var is missing
let genAI: GoogleGenerativeAI | null = null;

const getGenAI = (): GoogleGenerativeAI => {
  if (!genAI) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key Google Gemini tidak ditemukan. Pastikan VITE_GEMINI_API_KEY sudah diset di .env atau Vercel Environment Variables.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
};

export const analyzeThesisText = async (text: string, mode: AnalysisMode): Promise<ThesisAnalysis> => {
  const systemInstruction = `
    Anda adalah asisten editor skripsi profesional.
    Tugas Anda adalah memperbaiki teks sesuai mode yang diminta.
    
    PENTING:
    Output WAJIB berupa JSON valid dengan struktur berikut:
    {
      "formattedText": "Teks yang sudah diperbaiki",
      "suggestions": [
        {
          "category": "Grammar/Structure/Citation/Tone/Diction",
          "original": "Teks asli",
          "suggestion": "Saran perbaikan",
          "explanation": "Penjelasan kenapa harus diperbaiki"
        }
      ],
      "score": 0-100,
      "overallFeedback": "Umpan balik umum",
      "missingSections": ["Bagian yang hilang jika ada"]
    }
  `;

  // 1. Try Modern Models (Native JSON Mode)
  const modernModels = ["gemini-1.5-flash", "gemini-1.5-pro"];

  for (const modelName of modernModels) {
    try {
      console.log(`Trying modern model: ${modelName}`);
      const model = getGenAI().getGenerativeModel({
        model: modelName,
        systemInstruction: systemInstruction,
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: SchemaType.OBJECT,
            properties: {
              formattedText: { type: SchemaType.STRING },
              suggestions: {
                type: SchemaType.ARRAY,
                items: {
                  type: SchemaType.OBJECT,
                  properties: {
                    category: { type: SchemaType.STRING, format: "enum", enum: ["Grammar", "Structure", "Citation", "Tone", "Diction"] },
                    original: { type: SchemaType.STRING },
                    suggestion: { type: SchemaType.STRING },
                    explanation: { type: SchemaType.STRING }
                  },
                  required: ["category", "original", "suggestion", "explanation"]
                }
              },
              score: { type: SchemaType.NUMBER },
              overallFeedback: { type: SchemaType.STRING },
              missingSections: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            }
          }
        }
      });

      const result = await model.generateContent(`Mode: ${mode}\n\nTeks: ${text}`);
      return JSON.parse(result.response.text());
    } catch (e: any) {
      console.warn(`${modelName} failed, trying next...`, e.message);
    }
  }

  // 2. Fallback to Legacy Model (gemini-pro) with Plain Text Prompt
  try {
    console.log("Falling back to Legacy Mode (gemini-pro)");
    const model = getGenAI().getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
${systemInstruction}

Mode: ${mode}
Teks Asli: "${text}"

Perbaiki teks tersebut.
HANYA BERIKAN OUTPUT JSON RAW TEXT. JANGAN GUNAKAN FORMAT MARKDOWN.
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text();

    // Clean up markdown if the model disregarded the instruction
    responseText = responseText.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(responseText);

  } catch (error: any) {
    console.error("Critical Failure:", error);
    throw new Error(`Gagal memproses. Detail: ${error.message}`);
  }
};
