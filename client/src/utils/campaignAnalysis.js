export const analyzeCampaign = (campaign) => {

  const text = `${campaign.title} ${campaign.description}`;
  const lowerText = text.toLowerCase();

  // =========================
  // 🔴 FRAUD DETECTION
  // =========================
  let score = 0;
  let reasons = [];

  const target = Number(campaign.target) / 1e18;

  if (!campaign.description || campaign.description.length < 50) {
    score += 30;
    reasons.push("Short description");
  }

  if (target > 100) {
    score += 30;
    reasons.push("Very high funding goal");
  }

  if (!campaign.donators || campaign.donators.length === 0) {
    score += 20;
    reasons.push("No donors yet");
  }

  if (!campaign.image) {
    score += 10;
    reasons.push("No campaign image");
  }

  const exclamations = (text.match(/!/g) || []).length;
  if (exclamations > 5) {
    score += 10;
    reasons.push("Too many exclamation marks");
  }

  let riskLevel = "Low";
  let riskColor = "green";

  if (score >= 60) {
    riskLevel = "High";
    riskColor = "red";
  } else if (score >= 30) {
    riskLevel = "Medium";
    riskColor = "yellow";
  }

  // =========================
  // 😊 SENTIMENT (RULE-BASED DYNAMIC)
  // =========================
  let urgencyScore = 0;
  let positivityScore = 0;

  // intensity
  const capitalWords = (text.match(/\b[A-Z]{3,}\b/g) || []).length;
  urgencyScore += exclamations * 2;
  urgencyScore += capitalWords * 2;

  // length quality
  if (text.length > 120) positivityScore += 2;
  if (text.length < 40) urgencyScore += 2;

  // word diversity
  const words = lowerText.split(/\s+/);
  const uniqueWords = new Set(words);

  if (uniqueWords.size / words.length > 0.6) {
    positivityScore += 2;
  }

  // repetition
  if (words.length - uniqueWords.size > 5) {
    urgencyScore += 3;
  }

  // sentence structure
  const sentences = text.split(/[.!?]/).length;
  if (sentences > 2) positivityScore += 1;

  let sentimentType = "Neutral";
  let sentimentColor = "gray";

  if (urgencyScore >= 6) {
    sentimentType = "Urgent";
    sentimentColor = "red";
  } else if (positivityScore >= 3) {
    sentimentType = "Positive";
    sentimentColor = "green";
  }

  return {
    risk: {
      level: riskLevel,
      color: riskColor,
      reasons,
    },
    sentiment: {
      type: sentimentType,
      color: sentimentColor,
    },
  };
};