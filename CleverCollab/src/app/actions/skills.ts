"use server"

import fs from "fs/promises"
import path from "path"

export async function saveSkillsToFile(skills: any) {
  try {
    // Create a data directory if it doesn't exist
    const dataDir = path.join(process.cwd(), "data")
    try {
      await fs.mkdir(dataDir, { recursive: true })
    } catch (error) {
      // Directory might already exist, that's fine
    }

    // Save skills to a JSON file
    const filePath = path.join(dataDir, "skills.json")
    await fs.writeFile(filePath, JSON.stringify(skills, null, 2))

    return { success: true }
  } catch (error) {
    console.error("Error saving skills to file:", error)
    return { success: false, error: (error as Error).message }
  }
}

export async function loadSkillsFromFile() {
  try {
    const filePath = path.join(process.cwd(), "data", "skills.json")

    try {
      const data = await fs.readFile(filePath, "utf-8")
      return { success: true, skills: JSON.parse(data) }
    } catch (error) {
      // File might not exist yet, return empty array
      return { success: true, skills: [] }
    }
  } catch (error) {
    console.error("Error loading skills from file:", error)
    return { success: false, error: (error as Error).message, skills: [] }
  }
}

