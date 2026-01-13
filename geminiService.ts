
import { GoogleGenAI, Type } from "@google/genai";
import { ThesisAnalysis, AnalysisMode } from "./types";

// Lazy initialization to prevent crash on load if env var is missing
let ai: GoogleGenAI | null = null;

const getGenAI = (): GoogleGenAI => {
  if (!ai) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("API Key Google Gemini tidak ditemukan. Pastikan VITE_GEMINI_API_KEY sudah diset di .env atau Vercel Environment Variables.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
};

export const analyzeThesisText = async (text: string, mode: AnalysisMode): Promise<ThesisAnalysis> => {
  const model = "gemini-1.5-pro";

  const getSystemInstruction = (mode: AnalysisMode): string => {
    const basePuebi = `
    1. Gunakan Bahasa Indonesia formal yang baik dan benar (PUEBI).
    2. Pastikan format sitasi konsisten (default: APA Style).
    3. Nada bicara wajib objektif dan akademis.
    `;

    switch (mode) {
      case AnalysisMode.PROOFREAD:
        return `
        Anda adalah mesin proofreader otomatis. 
        Tugas Anda HANYA memperbaiki kesalahan teknis (typo, tanda baca, spasi, huruf kapital) sesuai PUEBI.
        
        ATURAN KERAS:
        1. DILARANG mengubah kata, diksi, atau struktur kalimat.
        2. DILARANG mengganti istilah asing atau daerah (cukup miringkan jika perlu).
        3. Biarkan naskah apa adanya kecuali ada kesalahan mekanis penulisan.
        4. Jangan memberikan saran yang mengubah makna.
        
        Output JSON harus berisi teks yang sudah diperbaiki per karakter.
        `;

      case AnalysisMode.ABSTRACT:
        return `
        Anda adalah editor spesialis Abstrak Skripsi.
        ${basePuebi}
        
        ATURAN KHUSUS ABSTRAK:
        1. Pastikan terdiri dari: Latar Belakang/Tujuan, Metode, Hasil, dan Simpulan.
        2. Cek jumlah kata (biasanya maks 250). Beri peringatan jika terlalu panjang.
        3. Pastikan tidak ada kutipan/sitasi di dalam abstrak (standar umum).
        4. Berikan saran Kata Kunci (Keywords) jika belum ada.
        `;

      case AnalysisMode.BIBLIOGRAPHY:
        return `
        Anda adalah pustakawan ahli sitasi.
        Tugas: Validasi dan format ulang Daftar Pustaka ini.
        
        ATURAN KHUSUS:
        1. Wajib format APA 7th Edition (kecuali diminta lain).
        2. Urutkan secara alfabetis (A-Z).
        3. Perbaiki styling (italic untuk judul buku/jurnal).
        `;

      default: // General & Chapter
        return `
        Anda adalah asisten editor ahli skripsi.
        ${basePuebi}
        
        ATURAN EDITING:
        1. Fokus pada Kalimat Efektif: Pecah kalimat yang terlalu panjang dan berbelit.
        2. Ganti kata ganti orang pertama (aku/saya/kami) menjadi "penulis" atau bentuk pasif, kecuali dalam Kutipan Langsung.
        3. JAGA MAKNA ASLI: Jangan mengubah substansi argumen penulis.
        4. Deteksi paragraf yang tidak kohesif.
        `;
    }
  };

  const response = await getGenAI().models.generateContent({
    model: model,
    contents: `Analisis dan rapikan teks berikut dengan mode: ${mode}.\n\nTeks:\n${text}`,
    config: {
      systemInstruction: getSystemInstruction(mode),
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          formattedText: { type: Type.STRING, description: "Teks yang sudah dirapikan." },
          suggestions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                category: { type: Type.STRING, enum: ["Grammar", "Structure", "Citation", "Tone", "Diction"] },
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
