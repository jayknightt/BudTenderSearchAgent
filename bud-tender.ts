"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import products from "../data/products.json"

type Product = {
  name: string
  type: string
  thc: number
  cbd: number
  effects: string[]
  flavor: string
}

const keywordMap: Record<string, string[]> = {
  relax: ["Calm Serenity", "Balanced Bliss", "Zen Master"],
  sleep: ["Calm Serenity", "Dreamweaver"],
  anxiety: ["Anxiety Ease", "Zen Master"],
  pain: ["Pain Zapper", "Calm Serenity"],
  energy: ["Blissful Haze", "Creative Spark"],
  creative: ["Creative Spark", "Focus Pocus"],
  focus: ["Focus Pocus", "Creative Spark"],
  social: ["Social Butterfly", "Balanced Bliss"],
}

function getLocalRecommendations(userInput: string): string {
  const lowercaseInput = userInput.toLowerCase()
  const matchedProducts = products
    .filter(
      (product) =>
        product.effects.some((effect) => lowercaseInput.includes(effect.toLowerCase())) ||
        lowercaseInput.includes(product.type.toLowerCase()) ||
        lowercaseInput.includes(product.flavor.toLowerCase()),
    )
    .slice(0, 3)

  if (matchedProducts.length === 0) {
    matchedProducts.push(products.find((p) => p.name === "Balanced Bliss") || products[0])
  }

  const recommendations = matchedProducts
    .map(
      (product, index) => `
${index + 1}. Product Name: ${product.name}
   Type: ${product.type}
   THC: ${product.thc}%
   CBD: ${product.cbd}%
   Effects: ${product.effects.join(", ")}
   Flavor: ${product.flavor}
   Description: ${product.name} is recommended based on your input. It offers ${product.effects.join(" and ")} effects with a ${product.flavor} flavor profile.
   Link: https://www.leafly.com/search?q=${product.name.toLowerCase().replace(/ /g, "-")}
  `,
    )
    .join("\n\n")

  const explanation = `These products were chosen based on keywords in your input that match their effects, type, or flavor profile. The selection aims to address your specific needs while providing a range of options.`

  return `${recommendations}\n\nExplanation: ${explanation}`
}

export async function getBudTenderRecommendation(userInput: string): Promise<string> {
  try {
    const prompt = `
      You are an AI bud tender for a cannabis dispensary in New York State. Based on the user's input, recommend up to three suitable products from New York State weed dispensaries.
      Consider the effects, flavors, and any specific needs mentioned by the user. Tailor your recommendations to the user's preferences and desired outcomes.
      
      User input: "${userInput}"
      
      Available products:
      ${JSON.stringify(products, null, 2)}
      
      Provide recommendations in the following format:
      1. Product Name: [Name]
         Type: [Indica/Sativa/Hybrid]
         THC: [Percentage]
         CBD: [Percentage]
         Effects: [List of effects]
         Flavor: [Flavor profile]
         Description: [Brief, personalized description of why this product is recommended based on the user's input]
         Link: https://www.leafly.com/search?q=[product-name-in-kebab-case]

      2. (If applicable) Second product recommendation...

      3. (If applicable) Third product recommendation...

      Explanation: [A brief, personalized explanation of why these specific products were chosen based on the user's input, mentioning key factors that influenced the recommendations]
    `

    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: prompt,
      maxTokens: 1000,
    })

    return text
  } catch (error) {
    console.error("OpenAI API error:", error)
    // Fallback to local recommendation system
    return getLocalRecommendations(userInput)
  }
}

