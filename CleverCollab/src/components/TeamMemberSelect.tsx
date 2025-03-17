"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TeamMember {
  id: string
  name: string
  email: string
}

interface TeamMemberSelectProps {
  selectedMemberId: string
  selectedMemberName: string
  onTeamMemberChange: (id: string, name: string) => void
  disabled?: boolean
}

export function TeamMemberSelect({ 
  selectedMemberId, 
  selectedMemberName, 
  onTeamMemberChange,
  disabled = false
}: TeamMemberSelectProps) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch team members on component mount
  useEffect(() => {
    const fetchTeamMembers = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/team-members");
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data);
        } else {
          console.error("Failed to fetch team members");
          // Fallback to hardcoded team members if API fails
          setTeamMembers([
            { id: "712020:f15989c0-31c3-4d67-9f58-4195acb97ddc", name: "Arya", email: "arya.narke@gmail.com" },
            { id: "712020:0d5fd58b-1b1e-42e5-bda4-4499281a6249", name: "Varad Parte", email: "partevr@mail.uc.edu" },
            { id: "61539e9d9cdb93007221a33c", name: "Daksh Prajapati", email: "prajapdh@mail.uc.edu" },
            { id: "62bbca19ec4c0d377f9fa23a", name: "Jalin Solankee", email: "solankjp@mail.uc.edu" }
          ]);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
        // Fallback to hardcoded team members if API fails
        setTeamMembers([
          { id: "712020:f15989c0-31c3-4d67-9f58-4195acb97ddc", name: "Arya", email: "arya.narke@gmail.com" },
          { id: "712020:0d5fd58b-1b1e-42e5-bda4-4499281a6249", name: "Varad Parte", email: "partevr@mail.uc.edu" },
          { id: "61539e9d9cdb93007221a33c", name: "Daksh Prajapati", email: "prajapdh@mail.uc.edu" },
          { id: "62bbca19ec4c0d377f9fa23a", name: "Jalin Solankee", email: "solankjp@mail.uc.edu" }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamMembers();
  }, []);

  const handleChange = (value: string) => {
    const selectedMember = teamMembers.find(member => member.name === value);
    if (selectedMember) {
      onTeamMemberChange(selectedMember.id, selectedMember.name);
    }
  };

  return (
    <Select 
      value={selectedMemberName} 
      onValueChange={handleChange}
      disabled={disabled || isLoading}
    >
      <SelectTrigger className="w-full h-7 text-xs py-0 px-2">
        <SelectValue placeholder="Select assignee" />
      </SelectTrigger>
      <SelectContent className="text-xs">
        {teamMembers.map(member => (
          <SelectItem key={member.id} value={member.name} className="py-1">
            {member.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
} 