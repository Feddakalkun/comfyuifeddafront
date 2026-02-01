import { ollamaService } from './ollamaService';

// Include the system prompt text directly or load it from a file if feasible. 
// For simplicity in the frontend, we'll embed the core instruction here.
// You could also fetch this from '/assets/instructions/ollama/t2i.txt' if you prefer to keep it separate.

const T2I_SYSTEM_PROMPT = `You are an expert AI image prompt engineer specialized in creating ultra-detailed, cinematic Flux-style prompts from very short user inputs.

GENERAL BEHAVIOR
- The user will usually give you only a few words or a short, messy idea.
- Your ONLY job is to transform that into ONE single, fully-formed, highly descriptive image prompt.
- Do NOT ask questions.
- Do NOT explain what you are doing.
- Do NOT add pre-text or post-text.
- Output ONLY the final prompt as plain text.

STYLE & FORMAT
- Write a single paragraph prompt, in natural English.
- Aim for 70–200 words depending on how much detail makes sense.
- Always include: subject, clothing or body details (if relevant), scene, environment, mood, lighting, colors, camera / lens, composition, style tags.
- Prefer Flux-friendly language like: "highly detailed", "cinematic lighting", "sharp focus", "subtle film grain".

INSTRUCTIONS SUMMARY
- Transform any short input into one long, rich, cinematic Flux-style image prompt.
- Never say anything except the final prompt.`;

const I2T_SYSTEM_PROMPT = `You are an expert AI image analyst.
GENERAL BEHAVIOR
- User provides an image.
- Output ONE single, fully-formed, highly descriptive image caption (50-150 words).
- Cover: subject, clothing, environment, lighting, style.
- NO extra text. Just the caption.
- Be brutally honest and detailed.
`;

export const assistantService = {
    // Enhance prompt using Ollama (T2I)
    enhancePrompt: async (modelName: string, userPrompt: string): Promise<string> => {
        try {
            const response = await fetch('/ollama/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelName,
                    prompt: userPrompt,
                    system: T2I_SYSTEM_PROMPT,
                    stream: false,
                    options: { temperature: 0.7 }
                }),
            });
            if (!response.ok) throw new Error('Failed to generate prompt');
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('AI Assist Error:', error);
            throw error;
        }
    },

    // Describe Image (I2T)
    describeImage: async (modelName: string, base64Image: string): Promise<string> => {
        try {
            // Remove header if present (data:image/png;base64,)
            const cleanBase64 = base64Image.replace(/^data:image\/[a-z]+;base64,/, "");

            const response = await fetch('/ollama/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: modelName,
                    prompt: "Describe this image in extreme detail.",
                    system: I2T_SYSTEM_PROMPT,
                    images: [cleanBase64],
                    stream: false,
                    options: { temperature: 0.2 } // Lower temp for more accurate description
                }),
            });
            if (!response.ok) throw new Error('Failed to describe image');
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Vision Assist Error:', error);
            throw error;
        }
    }
};
