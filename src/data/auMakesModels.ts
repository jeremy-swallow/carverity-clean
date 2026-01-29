/* src/data/auMakesModels.ts
   Australia-relevant makes + common imports (expanded MVP dataset)
   Designed for psychological completeness, not exhaustive taxonomy.
*/

export type MakeModelMap = Record<string, string[]>;

export const AU_MAKES_MODELS: MakeModelMap = {
  /* ======================
     European
  ====================== */
  "Alfa Romeo": ["Giulietta", "Giulia", "Stelvio"],
  Audi: ["A1", "A3", "A4", "A5", "A6", "Q2", "Q3", "Q5", "Q7"],
  BMW: ["1 Series", "2 Series", "3 Series", "4 Series", "5 Series", "X1", "X3", "X5"],
  Citroen: ["C3", "C4", "C5 Aircross"],
  Fiat: ["500", "500X", "Punto"],
  Jaguar: ["XE", "XF", "F-Pace", "E-Pace"],
  "Land Rover": ["Defender", "Discovery", "Discovery Sport", "Range Rover Evoque", "Velar"],
  Mini: ["Cooper", "Clubman", "Countryman"],
  Peugeot: ["208", "308", "2008", "3008", "5008"],
  Porsche: ["Macan", "Cayenne", "Panamera", "911"],
  Renault: ["Clio", "Megane", "Captur", "Koleos"],
  Skoda: ["Fabia", "Octavia", "Scala", "Kamiq", "Karoq", "Kodiaq"],
  Volkswagen: ["Polo", "Golf", "Passat", "Arteon", "T-Roc", "Tiguan", "Touareg", "Amarok"],
  Volvo: ["S60", "S90", "XC40", "XC60", "XC90"],

  /* ======================
     Japanese (core AU)
  ====================== */
  Honda: ["Civic", "Accord", "Jazz", "HR-V", "CR-V"],
  Isuzu: ["D-MAX", "MU-X"],
  Lexus: ["IS", "ES", "UX", "NX", "RX", "GX", "LX"],
  Mazda: ["Mazda 2", "Mazda 3", "Mazda 6", "CX-3", "CX-30", "CX-5", "CX-8", "CX-9", "MX-5"],
  Mitsubishi: ["ASX", "Outlander", "Pajero", "Pajero Sport", "Eclipse Cross", "Triton"],
  Nissan: ["Micra", "Pulsar", "Altima", "Qashqai", "X-Trail", "Pathfinder", "Navara", "Patrol"],
  Subaru: ["Impreza", "XV", "Forester", "Outback", "Liberty", "WRX"],
  Suzuki: ["Swift", "Baleno", "Vitara", "S-Cross", "Jimny"],
  Toyota: [
    "Yaris",
    "Corolla",
    "Camry",
    "Prius",
    "RAV4",
    "Kluger",
    "Fortuner",
    "HiLux",
    "LandCruiser",
    "LandCruiser Prado",
    "86"
  ],

  /* ======================
     Korean
  ====================== */
  Hyundai: [
    "Accent",
    "i20",
    "i30",
    "Elantra",
    "Sonata",
    "Kona",
    "Tucson",
    "Santa Fe",
    "Palisade"
  ],
  Kia: ["Picanto", "Rio", "Cerato", "Stonic", "Seltos", "Sportage", "Sorento", "Carnival"],

  /* ======================
     American / AU legacy
  ====================== */
  Chevrolet: ["Camaro", "Silverado"],
  Chrysler: ["300"],
  Dodge: ["Ram 1500"],
  Ford: [
    "Fiesta",
    "Focus",
    "Falcon",
    "Mondeo",
    "Escape",
    "Everest",
    "Ranger",
    "Mustang"
  ],
  Holden: [
    "Commodore",
    "Astra",
    "Barina",
    "Cruze",
    "Colorado",
    "Captiva"
  ],

  /* ======================
     Chinese / emerging
  ====================== */
  BYD: ["Atto 3", "Dolphin", "Seal"],
  Chery: ["Omoda 5", "Tiggo 7", "Tiggo 8"],
  "Great Wall": ["Cannon", "Steed"],
  Haval: ["H2", "Jolion", "H6"],
  LDV: ["T60", "D90", "G10"],
  MG: ["MG3", "MG4", "MG5", "ZS", "HS"],

  /* ======================
     EV / premium niche
  ====================== */
  Genesis: ["G70", "G80", "G90", "GV70", "GV80"],
  Polestar: ["2"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X"],

  /* ======================
     Grey imports / enthusiast
  ====================== */
  "Nissan Skyline": ["R32", "R33", "R34"],
  "Toyota Crown": ["Athlete", "Majesta"],
  "Toyota Alphard": ["Hybrid", "Executive Lounge"],
};
