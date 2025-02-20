import nlp from 'compromise';
import Sentiment from 'sentiment';

const sentimentAnalyzer = new Sentiment();

export const tokenizeText = (text) => {
  return nlp(text).terms().out('array');
};

export const analyzeSentiment = (text) => {
  const result = sentimentAnalyzer.analyze(text);
  return result.score;
};

export const classifyText = (text, classifier) => {
  return classifier.classify(text);
};

export const trainClassifier = (trainingData) => {
  const classifier = new nlp.classify();
  trainingData.forEach(({ text, label }) => {
    classifier.learn(text, label);
  });
  return classifier;
};