/* src/data/auMakesModels.ts
   Australia-relevant makes + common imports (MVP dataset)
   Safe to expand later or replace with API-backed data.
*/

export type MakeModelMap = Record<string, string[]>;

export const AU_MAKES_MODELS: MakeModelMap = {
  "Alfa Romeo": ["Giulietta", "Stelvio", "Giulia"],
  Audi: ["A1", "A3", "A4", "A5", "Q2", "Q3", "Q5", "Q7"],
  BMW: ["1 Series", "2 Series", "3 Series", "5 Series", "X1", "X3", "X5"],
  Chery: ["Omoda 5", "Tiggo 7"],
  Chevrolet: ["Camaro", "Silverado"],
  Citroen: ["C3", "C4", "C5 Aircross"],
  Dodge: ["Ram 1500"],
  Fiat: ["500", "Punto"],
  Ford: ["Fiesta", "Focus", "Ranger", "Everest", "Mustang"],
  Genesis: ["G70", "G80", "GV70", "GV80"],
  "Great Wall": ["Cannon", "Steed"],
  Haval: ["H2", "Jolion", "H6"],
  Holden: ["Commodore", "Astra", "Colorado", "Captiva"],
  Honda: ["Civic", "Accord", "HR-V", "CR-V"],
  Hyundai: ["i20", "i30", "Elantra", "Tucson", "Santa Fe", "Kona"],
  Isuzu: ["D-MAX", "MU-X"],
  Jeep: ["Compass", "Cherokee", "Grand Cherokee", "Wrangler"],
  Kia: ["Rio", "Cerato", "Seltos", "Sportage", "Sorento"],
  "Land Rover": ["Discovery", "Defender", "Range Rover Evoque", "Velar"],
  Lexus: ["UX", "NX", "RX", "IS", "ES"],
  LDV: ["T60", "D90", "G10"],
  Mazda: ["Mazda 2", "Mazda 3", "Mazda 6", "CX-3", "CX-30", "CX-5", "CX-9"],
  "Mercedes-Benz": ["A-Class", "C-Class", "E-Class", "GLA", "GLC", "GLE"],
  Mini: ["Cooper", "Countryman"],
  Mitsubishi: ["ASX", "Outlander", "Eclipse Cross", "Triton"],
  Nissan: ["Micra", "Pulsar", "Qashqai", "X-Trail", "Navara"],
  Peugeot: ["208", "308", "3008", "5008"],
  Polestar: ["2"],
  Porsche: ["Macan", "Cayenne", "911"],
  Renault: ["Clio", "Megane", "Captur", "Koleos"],
  Skoda: ["Fabia", "Octavia", "Kamiq", "Karoq", "Kodiaq"],
  Subaru: ["Impreza", "XV", "Forester", "Outback", "WRX"],
  Suzuki: ["Swift", "Vitara", "Jimny"],
  Tesla: ["Model 3", "Model Y"],
  Toyota: ["Yaris", "Corolla", "Camry", "RAV4", "Kluger", "HiLux"],
  Volkswagen: ["Polo", "Golf", "Passat", "T-Roc", "Tiguan", "Amarok"],
  Volvo: ["XC40", "XC60", "XC90"],

  // Common grey imports / niche AU market
  "Nissan Skyline": ["R32", "R33", "R34"],
  "Toyota Crown": ["Athlete", "Majesta"],
  "Toyota Alphard": ["Hybrid", "Executive Lounge"],
};
