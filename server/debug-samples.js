// Sample items used by the fake "ok" scenario
// The source quotes match the sample notes in src/lib/examples.js

export const SAMPLE_QUESTIONS = [
  {
    question: "Where do the light reactions take place?",
    options: ["Thylakoid membranes", "Stroma", "Cytoplasm", "Nucleus"],
    answer: "Thylakoid membranes",
    explanation: "The light reactions happen in the thylakoid membranes inside the chloroplast.",
    source: "The light reactions take place in the thylakoid membranes.",
  },
  {
    question: "Which gas is released when water is split in the light reactions?",
    options: ["Oxygen", "Carbon dioxide", "Nitrogen", "Hydrogen"],
    answer: "Oxygen",
    explanation: "Splitting water releases oxygen as a by-product.",
    source: "light energy splits water molecules, releasing oxygen as a by-product",
  },
  {
    question: "Which two carrier molecules store energy from the light reactions?",
    options: ["ATP and NADPH", "Glucose and RuBP", "ADP and water", "Oxygen and carbon dioxide"],
    answer: "ATP and NADPH",
    explanation: "The light reactions capture energy in ATP and NADPH for the Calvin cycle.",
    source: "The energy is captured in two carrier molecules, ATP and NADPH.",
  },
  {
    question: "Where does the Calvin cycle take place?",
    options: ["Stroma", "Thylakoid membranes", "Mitochondria", "Cell wall"],
    answer: "Stroma",
    explanation: "The Calvin cycle runs in the stroma, the fluid around the thylakoids.",
    source: "the Calvin cycle, which takes place in the stroma",
  },
  {
    question: "Which enzyme captures carbon dioxide in the Calvin cycle?",
    options: ["RuBisCO", "Amylase", "ATP synthase", "Catalase"],
    answer: "RuBisCO",
    explanation: "RuBisCO attaches carbon dioxide to RuBP.",
    source: "The enzyme RuBisCO captures carbon dioxide",
  },
  {
    question: "Why do leaves look green?",
    options: [
      "Chlorophyll reflects green light",
      "Chlorophyll absorbs green light",
      "Leaves store green sugar",
      "Stomata are green",
    ],
    answer: "Chlorophyll reflects green light",
    explanation: "Chlorophyll absorbs red and blue light and reflects green.",
    source: "reflects green light, which is why leaves look green",
  },
  {
    question: "Which photosystem splits water?",
    options: ["Photosystem II", "Photosystem I", "Both equally", "Neither"],
    answer: "Photosystem II",
    explanation: "Photosystem II comes first in the chain and splits water.",
    source: "Photosystem II comes first in the chain and is the one that splits water",
  },
  {
    question: "What do stomata do?",
    options: ["Let carbon dioxide in and oxygen out", "Absorb light", "Store glucose", "Split water"],
    answer: "Let carbon dioxide in and oxygen out",
    explanation: "Stomata are pores that control gas exchange.",
    source: "Stomata are small pores on the leaf surface that let carbon dioxide in and oxygen out.",
  },
  {
    question: "How many oxygen molecules are made for each glucose molecule?",
    options: ["Six", "One", "Two", "Twelve"],
    answer: "Six",
    explanation: "The overall equation makes one glucose and six oxygen molecules.",
    source: "make one molecule of glucose and six molecules of oxygen",
  },
  {
    question: "Which of these is NOT listed as a limiting factor for photosynthesis?",
    options: ["Soil colour", "Light intensity", "Carbon dioxide concentration", "Temperature"],
    answer: "Soil colour",
    explanation: "The listed factors are light intensity, carbon dioxide concentration, and temperature.",
    source: "Factors that limit the rate of photosynthesis include light intensity",
  },
  {
    question: "Does the Calvin cycle need light directly?",
    options: [
      "No, but it depends on products of the light reactions",
      "Yes, it only runs in bright light",
      "No, it is fully independent of light",
      "Yes, it splits water",
    ],
    answer: "No, but it depends on products of the light reactions",
    explanation: "It uses ATP and NADPH made by the light reactions.",
    source: "The Calvin cycle does not need light directly",
  },
  {
    question: "What five-carbon sugar does RuBisCO attach carbon dioxide to?",
    options: ["RuBP", "Glucose", "Ribose", "Sucrose"],
    answer: "RuBP",
    explanation: "RuBisCO fixes carbon dioxide onto RuBP.",
    source: "a five-carbon sugar called RuBP",
  },
];

export const SAMPLE_CARDS = [
  {
    front: "What is photosynthesis?",
    back: "The process that turns light energy into chemical energy stored in glucose.",
    source: "turn light energy into chemical energy stored in glucose",
  },
  {
    front: "Where in the cell does photosynthesis happen?",
    back: "In the chloroplasts.",
    source: "It takes place in the chloroplasts",
  },
  {
    front: "What colours of light does chlorophyll absorb most?",
    back: "Red and blue.",
    source: "Chlorophyll absorbs mostly red and blue light",
  },
  {
    front: "Where do the light reactions take place?",
    back: "In the thylakoid membranes.",
    source: "The light reactions take place in the thylakoid membranes.",
  },
  {
    front: "What by-product comes from splitting water?",
    back: "Oxygen.",
    source: "light energy splits water molecules, releasing oxygen as a by-product",
  },
  {
    front: "Which carrier molecules hold energy from the light reactions?",
    back: "ATP and NADPH.",
    source: "The energy is captured in two carrier molecules, ATP and NADPH.",
  },
  {
    front: "Which photosystem comes first and splits water?",
    back: "Photosystem II.",
    source: "Photosystem II comes first in the chain and is the one that splits water",
  },
  {
    front: "What is the stroma?",
    back: "The fluid around the thylakoids, where the Calvin cycle happens.",
    source: "the stroma, the fluid around the thylakoids",
  },
  {
    front: "What does RuBisCO do?",
    back: "It captures carbon dioxide and attaches it to RuBP.",
    source: "The enzyme RuBisCO captures carbon dioxide",
  },
  {
    front: "What is RuBP?",
    back: "A five-carbon sugar that carbon dioxide is attached to in the Calvin cycle.",
    source: "a five-carbon sugar called RuBP",
  },
  {
    front: "Name three factors that limit the rate of photosynthesis.",
    back: "Light intensity, carbon dioxide concentration, and temperature.",
    source: "light intensity, carbon dioxide concentration, and temperature",
  },
  {
    front: "What are stomata?",
    back: "Small pores on the leaf that let carbon dioxide in and oxygen out.",
    source: "Stomata are small pores on the leaf surface",
  },
];
