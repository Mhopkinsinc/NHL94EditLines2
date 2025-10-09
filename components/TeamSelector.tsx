
import React from 'react';

interface TeamSelectorProps {
  teams: string[];
  selectedTeamName: string;
  onTeamChange: (teamName: string) => void;
  disabled?: boolean;
}

export const TeamSelector: React.FC<TeamSelectorProps> = ({ teams, selectedTeamName, onTeamChange, disabled }) => {
  return (
    <div>
      <label htmlFor="team-selector" className="sr-only">Select Team</label>
      <select
        id="team-selector"
        value={selectedTeamName}
        onChange={(e) => onTeamChange(e.target.value)}
        className="bg-[#2B3544] border border-gray-600 text-white text-sm rounded-lg focus:ring-sky-500 focus:border-sky-500 block w-full p-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
      >
        {teams.length === 0 && <option>Upload a ROM to see teams</option>}
        {teams.map(team => (
          <option 
            key={team} 
            value={team} 
          >
            {team}
          </option>
        ))}
      </select>
    </div>
  );
};
