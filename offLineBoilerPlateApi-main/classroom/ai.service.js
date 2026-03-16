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

async function checkQuestionRelevance(subjectName, questionText) {
  const prompt = `
You are an educational content reviewer. Determine if the following question is relevant to the subject.

Subject: "${subjectName}"
Question: "${questionText}"

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
    console.error("Gemini AI Error (question relevance):", err);
    return {
      isRelevant: false,
      feedback: "AI relevance check unavailable."
    };
  }
}

async function generateMcqOptions(questionText, correctAnswer) {
  const prompt = `
You are helping a teacher create a multiple choice question.

Question:
"${questionText}"

Correct answer:
"${correctAnswer}"

Generate 3 plausible but incorrect distractor options that are short (max 5 words each).
Respond using this exact format (one line per option):

Option1: ...
Option2: ...
Option3: ...
`;

  try {
    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();

    const options = [];
    const regex = /Option\d+\s*:\s*(.+)/gi;
    let match;
    while ((match = regex.exec(raw)) !== null) {
      const opt = match[1].trim();
      if (opt) options.push(opt);
    }

    return options;
  } catch (err) {
    console.error("Gemini AI Error (generate MCQ options):", err);
    return [];
  }
}

module.exports = { reviewAnswer, checkQuestionRelevance, generateMcqOptions };