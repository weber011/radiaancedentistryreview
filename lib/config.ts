// Primary Business & Brand Configuration for Radiaance Dentistry
// Easy to update via environment variables or the Admin Dashboard

export const GOOGLE_REVIEW_URL =
  process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL ||
  "https://www.google.com/search?q=radiaance+dentistry+surat&oq=radiaance+dentistry+surat&gs_lcrp=EgZjaHJvbWUyBggAEEUYOTIJCAEQABgKGIAEMgkIAhAAGAoYgAQyDQgDEAAYhgMYgAQYigUyDQgEEAAYhgMYgAQYigUyDQgFEAAYhgMYgAQYigUyDQgGEAAYhgMYgAQYigXSAQg2NDY2ajBqNKgCALACAQ&sourceid=chrome&source=chrome.ob&ie=UTF-8#lrd=0x3be04def3d54f6f7:0x6040fa360bcfa0bf,3,,,,";

export const INSTAGRAM_URL =
  process.env.NEXT_PUBLIC_INSTAGRAM_URL ||
  "https://www.instagram.com/radiaance._.dentistry/";

export const BUSINESS_CONFIG = {
  id: "radiaance-dentistry-surat",
  slug: "radiaance",
  name: "Radiaance Dentistry",
  city: "Surat",
  state: "Gujarat",
  country: "India",
  tagline: "Your smile matters to us.",
  welcomeSubtext: "Take a moment to share your genuine experience with us.",
  instagramUrl: INSTAGRAM_URL,
  instagramHandle: "@radiaance._.dentistry",
  googleReviewUrl: GOOGLE_REVIEW_URL,
  expressMode: true,
  logo: "/logo.svg",
  theme: {
    primaryColor: "#0E7490", // Dental cyan/deep teal
    secondaryColor: "#0284C7", // Calming clinical ocean blue
    accentColor: "#14B8A6", // Vibrant fresh mint / aqua
    bgIvory: "#F8FAFC",
  },
  defaultPrompts: [
    // 5 Stars
    {
      rating: 5,
      promptText: "Tell us what you appreciated most about your visit.",
      starterText: "I had a wonderful visit at Radiaance Dentistry. The care and attention to detail were exceptional, and the team made the entire experience comfortable.",
    },
    {
      rating: 5,
      promptText: "What did you like about the doctor, staff, treatment or overall experience?",
      starterText: "Dr. and the entire staff at Radiaance Dentistry were extremely welcoming, polite, and professional. The treatment was gentle and thoroughly explained.",
    },
    {
      rating: 5,
      promptText: "What made your visit comfortable?",
      starterText: "Radiaance Dentistry has a very clean, modern and calming environment. The staff ensured I was comfortable and pain-free throughout my procedure.",
    },
    // 4 Stars
    {
      rating: 4,
      promptText: "What went well during your visit?",
      starterText: "I had a good experience at Radiaance Dentistry. The clinic is very well maintained, and the treatment was handled smoothly.",
    },
    {
      rating: 4,
      promptText: "What part of your experience did you appreciate?",
      starterText: "The consultation at Radiaance Dentistry was clear and helpful. The dental team answered all my questions patiently.",
    },
    // 3 Stars
    {
      rating: 3,
      promptText: "What worked well for you?",
      starterText: "The treatment at Radiaance Dentistry was fine and the team was polite. A couple of areas could be smoother, but overall an okay visit.",
    },
    {
      rating: 3,
      promptText: "What could have made your experience better?",
      starterText: "Here is my honest feedback on what could be improved regarding appointment scheduling or wait times at Radiaance Dentistry: ",
    },
    // 1-2 Stars
    {
      rating: 2,
      promptText: "What happened during your visit?",
      starterText: "I want to share my candid experience regarding my recent visit to Radiaance Dentistry so the team can address this: ",
    },
    {
      rating: 2,
      promptText: "What could we improve?",
      starterText: "My visit did not meet expectations in terms of: ",
    },
    {
      rating: 1,
      promptText: "What could we improve?",
      starterText: "I was not satisfied with my experience at Radiaance Dentistry. Specifically: ",
    },
    {
      rating: 1,
      promptText: "How can we make your next experience better?",
      starterText: "To improve patient satisfaction, I recommend the clinic focus on: ",
    },
  ],
};
