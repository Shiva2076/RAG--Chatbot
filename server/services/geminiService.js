import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getGeminiResponse(messages, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      
      // Format conversation history
      const conversation = messages.map(msg => 
        `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.message}`
      ).join('\n');
      
      const prompt = `${conversation}\nAssistant:`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      
      return response.text().trim();
      
    } catch (error) {
      console.error(`Gemini API attempt ${attempt} failed:`, error.message);
      
      if (attempt === retries) {
        throw new Error(`Gemini API failed after ${retries} attempts: ${error.message}`);
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
}

// Alternative simple response for testing
export async function getMockResponse(messages) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const userMessage = messages.find(msg => msg.role === 'user');
  const userText = userMessage?.message || '';
  
  const responses = [
    `I understand you're asking about "${userText}". Here's what I found in the latest news...`,
    `Based on current news, here's the information about "${userText}"...`,
    `I've analyzed recent news regarding "${userText}". Here are the key points...`,
    `Regarding "${userText}", here's the latest news update...`
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}