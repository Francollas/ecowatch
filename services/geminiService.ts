import { GoogleGenAI, Type } from "@google/genai";

export const generateEnvironmentalInsights = async (region: string, data: any): Promise<string> => {
  try {
    // Initialize inside the function to ensure it uses the latest process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const response = await ai.models.generateContent({
      // Using gemini-3-flash-preview for high speed and reliability in environmental analysis
      model: 'gemini-3-flash-preview',
      contents: `Analise os seguintes dados ambientais para a região de ${region}: ${JSON.stringify(data)}.
      Forneça insights técnicos sobre:
      1. O impacto do desmatamento na produção de chuva (bomba biótica e rios voadores).
      2. Perda de biodiversidade local e sequestro de carbono.
      3. IMPORTANTE: Não mencione "Perda da Capacidade Futura". No lugar disso, forneça uma seção detalhada chamada "Espécies Recomendadas para Rápido Reflorestamento" específica para o bioma desta região (ex: se for Amazônia, Cerrado, etc).
      Seja técnico, utilize dados científicos reais baseados no local e mantenha um tom de urgência ambiental.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
        // Optional: add a small thinking budget for better reasoning
        thinkingConfig: { thinkingBudget: 0 }
      }
    });
    
    return response.text || "Análise indisponível para esta região no momento.";
  } catch (error) {
    console.error("Error generating insights:", error);
    return "Não foi possível gerar insights no momento. Verifique se a sua API_KEY está configurada corretamente no painel do Vercel.";
  }
};

export const fetchEcoNews = async (): Promise<any[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Gere 6 notícias reais ou baseadas em tendências de 2024/2025 sobre desmatamento global, queimadas na Amazônia, novos recordes de temperatura e soluções de reflorestamento tecnológico.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              summary: { type: Type.STRING },
              source: { type: Type.STRING },
              date: { type: Type.STRING },
              category: { type: Type.STRING },
            },
            required: ["id", "title", "summary", "source", "date", "category"]
          }
        }
      }
    });
    const jsonStr = response.text?.trim();
    return jsonStr ? JSON.parse(jsonStr) : [];
  } catch (error) {
    console.error("Error fetching news:", error);
    return [];
  }
};

export const getCoordinatesForPlace = async (place: string): Promise<any> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Retorne as coordenadas geográficas aproximadas (latitude e longitude) para o seguinte local: "${place}". Responda estritamente em JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            lat: { type: Type.NUMBER },
            lng: { type: Type.NUMBER }
          },
          required: ["lat", "lng"]
        }
      }
    });
    const jsonStr = response.text?.trim();
    return jsonStr ? JSON.parse(jsonStr) : null;
  } catch (error) {
    console.error("Error fetching coordinates:", error);
    return null;
  }
};