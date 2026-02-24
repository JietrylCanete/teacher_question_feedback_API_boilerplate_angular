const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-3-flash-preview"
});

async function reviewAnswer(questionText, answerText) {
  const prompt = `
Evaluate if the student answer is relevant to this question.

Question:
"${questionText}"

Student Answer:
"${answerText}"

Respond using this exact format:

Relevant: Yes or No
Feedback: One short sentence explaining why.
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    // Extract "Relevant"
    const relevantMatch = raw.match(/relevant\s*:\s*(yes|no)/i);
    const isRelevant = relevantMatch
      ? relevantMatch[1].toLowerCase() === "yes"
      : false;

    // Extract "Feedback"
    const feedbackMatch = raw.match(/feedback\s*:\s*(.*)/i);
    let feedback = feedbackMatch ? feedbackMatch[1].trim() : "";

    if (!feedback) {
      feedback = raw.split(/[.\n]/)[0];
    }

    return { isRelevant, feedback };
  } catch (err) {
    console.error("Gemini AI Error:", err);
    return {
      isRelevant: false,
      feedback: "Feedback unavailable (AI error)."
    };
  }
}

module.exports = { reviewAnswer };