import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Define the path to the team_members.json file
    const filePath = path.join(process.cwd(), 'data', 'team_members.json');
    
    // Check if the file exists
    if (!fs.existsSync(filePath)) {
      console.warn('team_members.json file not found at:', filePath);
      // Return hardcoded fallback data
      return NextResponse.json([
        { id: "712020:f15989c0-31c3-4d67-9f58-4195acb97ddc", name: "Arya", email: "arya.narke@gmail.com" },
        { id: "712020:0d5fd58b-1b1e-42e5-bda4-4499281a6249", name: "Varad Parte", email: "partevr@mail.uc.edu" },
        { id: "61539e9d9cdb93007221a33c", name: "Daksh Prajapati", email: "prajapdh@mail.uc.edu" },
        { id: "62bbca19ec4c0d377f9fa23a", name: "Jalin Solankee", email: "solankjp@mail.uc.edu" }
      ]);
    }
    
    // Read and parse the JSON file
    const fileData = fs.readFileSync(filePath, 'utf8');
    const teamMembers = JSON.parse(fileData);
    
    return NextResponse.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    
    // Return hardcoded fallback data in case of error
    return NextResponse.json([
      { id: "712020:f15989c0-31c3-4d67-9f58-4195acb97ddc", name: "Arya", email: "arya.narke@gmail.com" },
      { id: "712020:0d5fd58b-1b1e-42e5-bda4-4499281a6249", name: "Varad Parte", email: "partevr@mail.uc.edu" },
      { id: "61539e9d9cdb93007221a33c", name: "Daksh Prajapati", email: "prajapdh@mail.uc.edu" },
      { id: "62bbca19ec4c0d377f9fa23a", name: "Jalin Solankee", email: "solankjp@mail.uc.edu" }
    ]);
  }
} 