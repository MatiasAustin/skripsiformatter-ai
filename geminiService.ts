
import { GoogleGenAI, Type } from "@google/genai";
import { ThesisAnalysis, AnalysisMode } from "./types";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

export const analyzeThesisText = async (text: string, mode: AnalysisMode): Promise<ThesisAnalysis> => {
  const model = "gemini-1.5-pro";

  const systemInstruction = `
    Anda adalah asisten editor ahli untuk penulisan skripsi dan karya ilmiah di Indonesia.
    Tugas Anda adalah merapikan teks yang diberikan agar sesuai dengan standar akademik:
    1. Gunakan Bahasa Indonesia formal yang baik dan benar (PUEBI).
    2. Pastikan nada bicara objektif dan akademis.
    3. Perbaiki kesalahan penulisan, ejaan, dan tanda baca.
    4. Pastikan format sitasi konsisten (default: APA Style).
    5. Berikan daftar saran perbaikan spesifik.
    6. Deteksi jika ada bagian bab yang biasanya wajib namun hilang.
    
    Format respon harus selalu JSON yang valid sesuai dengan skema yang diminta.
  `;

  const response = await ai.models.generateContent({
    model: model,
    contents: `Analisis dan rapikan teks berikut dengan mode: ${mode}.\n\nTeks:\n${text}`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          formattedText: { type: Type.STRING, description: "Teks yang sudah dirapikan secara menyeluruh." },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, enum: ["Grammar", "Structure", "Citation", "Tone"] },
                original: { type: Type.STRING },
                suggestion: { type: Type.STRING },
                explanation: { type: Type.STRING }
              },
              required: ["category", "original", "suggestion", "explanation"]
            }
          },
          score: { type: Type.NUMBER, description: "Skor kualitas tulisan 0-100." },
          overallFeedback: { type: Type.STRING },
          missingSections: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["formattedText", "suggestions", "score", "overallFeedback", "missingSections"]
      }
    }
  });

  try {
    return JSON.parse(response.text);
  } catch (error) {
    console.error("Failed to parse Gemini response", error);
    throw new Error("Gagal memproses analisis teks. Silakan coba lagi.");
  }
};
