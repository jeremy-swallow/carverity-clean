/* src/data/auMakesModels.ts
   Australia-relevant makes + common imports (expanded for testing)
*/

export type MakeModelMap = Record<string, string[]>;

export const AU_MAKES_MODELS: MakeModelMap = {
  "Holden": ["Commodore", "Astra", "Barina", "Cruze", "Colorado", "Trailblazer", "Captiva", "Calais", "Ute"],
  "Ford": ["Falcon", "Territory", "Fiesta", "Focus", "Mondeo", "Escape", "Everest", "Ranger", "Mustang"],

  "Toyota": ["Yaris", "Corolla", "Camry", "Aurion", "Prius", "RAV4", "Kluger", "Fortuner", "HiAce", "HiLux", "LandCruiser", "LandCruiser Prado", "C-HR", "86"],
  "Mazda": ["Mazda 2", "Mazda 3", "Mazda 6", "CX-3", "CX-30", "CX-5", "CX-8", "CX-9", "BT-50", "MX-5"],
  "Nissan": ["Micra", "Pulsar", "Tiida", "Altima", "Qashqai", "X-Trail", "Pathfinder", "Navara", "Patrol"],
  "Mitsubishi": ["Lancer", "ASX", "Outlander", "Pajero", "Pajero Sport", "Eclipse Cross", "Triton", "Delica"],
  "Subaru": ["Impreza", "Liberty", "XV", "Forester", "Outback", "WRX", "BRZ"],
  "Honda": ["Civic", "Accord", "Jazz", "City", "HR-V", "CR-V", "Odyssey"],
  "Suzuki": ["Swift", "Baleno", "Celerio", "Vitara", "S-Cross", "Jimny"],
  "Isuzu": ["D-MAX", "MU-X"],
  "Lexus": ["IS", "ES", "GS", "LS", "UX", "NX", "RX", "GX", "LX"],

  "Hyundai": ["Accent", "i20", "i30", "Elantra", "Sonata", "Ioniq", "Kona", "Tucson", "Santa Fe", "Palisade"],
  "Kia": ["Picanto", "Rio", "Cerato", "Optima", "Stonic", "Seltos", "Sportage", "Sorento", "Carnival"],

  "Volkswagen": ["Polo", "Golf", "Passat", "Jetta", "Arteon", "T-Cross", "T-Roc", "Tiguan", "Touareg", "Amarok"],
  "BMW": ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "X1", "X3", "X5"],
  "Audi": ["A1", "A3", "A4", "A5", "A6", "Q2", "Q3", "Q5", "Q7"],

  "Mercedes-Benz": ["A-Class", "B-Class", "C-Class", "E-Class", "M-Class", "GLE", "GLA", "GLC", "GLS"],

  "Skoda": ["Fabia", "Rapid", "Octavia", "Scala", "Kamiq", "Karoq", "Kodiaq"],
  "Peugeot": ["208", "308", "2008", "3008", "5008"],
  "Renault": ["Clio", "Megane", "Captur", "Koleos"],
  "Volvo": ["S60", "S90", "XC40", "XC60", "XC90"],
  "Mini": ["Cooper", "Clubman", "Countryman"],
  "Porsche": ["Macan", "Cayenne", "Panamera", "911"],
  "Jaguar": ["XE", "XF", "F-Pace", "E-Pace"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover Evoque", "Velar", "Range Rover"],

  "Chevrolet": ["Camaro", "Silverado"],
  "Chrysler": ["300"],
  "Jeep": ["Compass", "Cherokee", "Grand Cherokee", "Wrangler"],
  "RAM": ["1500", "2500"],

  "BYD": ["Atto 3", "Dolphin", "Seal"],
  "Chery": ["Omoda 5", "Tiggo 7", "Tiggo 8"],
  "Haval": ["H2", "Jolion", "H6"],
  "Great Wall": ["Cannon", "Steed"],
  "LDV": ["T60", "D90", "G10", "Deliver 9"],
  "MG": ["MG3", "MG4", "MG5", "ZS", "HS"],

  "Tesla": ["Model 3", "Model Y", "Model S", "Model X"],
  "Genesis": ["G70", "G80", "G90", "GV70", "GV80"],
  "Polestar": ["2"],

  "Nissan Skyline": ["R32", "R33", "R34"],
  "Toyota Crown": ["Athlete", "Majesta"],
  "Toyota Alphard": ["Hybrid", "Executive Lounge"]
};
