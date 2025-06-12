/**
 * Competition Details and Project Data
 * Processed from Airtable data for the Sui Overflow competition
 */

export interface Project {
  id: string;
  name: string;
  logo?: string;
  homepage?: string;
  demoVideo?: string;
  twitterPage?: string;
  spreadIndex: number; // Index for market resolution (0-based)
}

export interface CompetitionTrack {
  id: string;
  name: string;
  description: string;
  marketId: string; // Will be filled when markets are created
  projectCount: number;
  projects: Project[];
}

// Helper function to extract logo URL from Airtable format
function extractLogoUrl(logoField?: string): string | undefined {
  if (!logoField) return undefined;
  const match = logoField.match(/\((https:\/\/[^)]+)\)/);
  return match ? match[1] : undefined;
}

// Import the complete raw projects data from the JSON file
import rawProjectsData from '../constants/projects.json';

// Process the raw projects data from Airtable  
const rawProjects = rawProjectsData;

// Group projects by track
function groupProjectsByTrack(): Map<string, Project[]> {
  const trackMap = new Map<string, Project[]>();
  
  rawProjects.forEach((project) => {
    if (!project.fields || !project.fields["Project Name"] || !project.fields.Track) {
      return; // Skip incomplete entries
    }
    
    const trackName = project.fields.Track;
    
    if (!trackMap.has(trackName)) {
      trackMap.set(trackName, []);
    }
    
    const projects = trackMap.get(trackName)!;
    const spreadIndex = projects.length; // Auto-assign based on order
    
    projects.push({
      id: project.id,
      name: project.fields["Project Name"],
      logo: extractLogoUrl(project.fields["Project Logo"]),
      homepage: project.fields.Homepage,
      demoVideo: project.fields["Demo Video"],
      twitterPage: project.fields["Project X Page"],
      spreadIndex
    });
  });
  
  return trackMap;
}

// Generate competition tracks
const projectsByTrack = groupProjectsByTrack();

export const COMPETITION_TRACKS: CompetitionTrack[] = [
  {
    id: 'ai',
    name: 'AI',
    description: 'AI-powered applications and tools on Sui',
    marketId: '0xcaa789ce815ea722049a6ae868f3128a26fb084c4bec36421bf60fdf2434d056',
    projectCount: 5,
    projects: projectsByTrack.get('AI') || []
  },
  {
    id: 'cryptography',
    name: 'Cryptography',
    description: 'Cryptographic innovations and privacy solutions',
    marketId: '0xd5a9e20df4b223f6ecedbb6531c423acfec81d24147c637adcb593201b7e67cb',
    projectCount: 7,
    projects: projectsByTrack.get('Cryptography') || []
  },
  {
    id: 'defi',
    name: 'DeFi',
    description: 'Decentralized Finance protocols and applications',
    marketId: '0x9b011d807c6efe2e4e0a756e5156ec62f62cb2f035266add8d40e718fc39afae',
    projectCount: 8,
    projects: projectsByTrack.get('DeFi') || []
  },
  {
    id: 'degen',
    name: 'Degen',
    description: 'Experimental and high-risk applications',
    marketId: '0x4d34184f6528eb5176a0b39d6674d65d4921c966fab197a7e4394dc5ff424ae7',
    projectCount: 5,
    projects: projectsByTrack.get('Degen') || []
  },
  {
    id: 'entertainment',
    name: 'Entertainment & Culture',
    description: 'Gaming, entertainment, and cultural applications',
    marketId: '0xba9dd7799a98a6a45d58cff5d8c91540cf356c28e8414d915c36e65382696c11',
    projectCount: 7,
    projects: projectsByTrack.get('Entertainment & Culture') || []
  },
  {
    id: 'explorations',
    name: 'Explorations',
    description: 'Experimental and exploratory projects',
    marketId: '0xde7bbcb5802d0136abe6ff98d0edbdcf5ce13ebd6eef5797e85699e36f4e5366',
    projectCount: 5,
    projects: projectsByTrack.get('Explorations') || []
  },
  {
    id: 'infra',
    name: 'Infra & Tooling',
    description: 'Infrastructure and developer tooling',
    marketId: '0x50add4ac669cb2bd854334e9c593047259736c3c3c52572a8f33c73de18dcfa8',
    projectCount: 7,
    projects: projectsByTrack.get('Infra and Tooling') || []
  },
  {
    id: 'payments',
    name: 'Payments & Wallets',
    description: 'Payment solutions and wallet applications',
    marketId: '0xa837039ed8cd8f93aca6837abaf02a66e0b5196b880c4c269266a3b4a55aa4ae',
    projectCount: 4,
    projects: projectsByTrack.get('Payments and Wallets') || []
  },
  {
    id: 'storage',
    name: 'Programmable Storage',
    description: 'Storage solutions and data management',
    marketId: '0x775279e850acef40f5f3729e3cf38b059179860898c8720602d1aac1d0dba94f',
    projectCount: 8,
    projects: projectsByTrack.get('Programmable Storage') || []
  }
];

// Competition metadata
export const COMPETITION_INFO = {
  name: 'Sui Overflow 2025',
  description: 'Predict the winners of the Sui Overflow hackathon across 9 different tracks',
  startDate: '2025-06-12T00:00:00Z', // Today
  endDate: '2025-06-19T00:00:00Z', // 7 days from now
  totalTracks: 9,
  totalProjects: 56, // Updated with actual count from projects.json
  website: 'https://sui.io/overflow'
};

// Helper function to get track by ID
export function getTrackById(trackId: string): CompetitionTrack | undefined {
  return COMPETITION_TRACKS.find(track => track.id === trackId);
}

// Helper function to get project by ID across all tracks
export function getProjectById(projectId: string): { project: Project; track: CompetitionTrack } | undefined {
  for (const track of COMPETITION_TRACKS) {
    const project = track.projects.find(p => p.id === projectId);
    if (project) {
      return { project, track };
    }
  }
  return undefined;
}

// Helper function to check if a market ID belongs to competition
export function isCompetitionMarket(marketId: string): boolean {
  return COMPETITION_TRACKS.some(track => track.marketId === marketId);
}

// Helper function to get track by market ID
export function getTrackByMarketId(marketId: string): CompetitionTrack | undefined {
  return COMPETITION_TRACKS.find(track => track.marketId === marketId);
}

export default {
  COMPETITION_TRACKS,
  COMPETITION_INFO,
  getTrackById,
  getProjectById,
  isCompetitionMarket,
  getTrackByMarketId
};
