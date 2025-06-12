import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Trophy, Users, ExternalLink } from 'lucide-react';
import { COMPETITION_TRACKS, COMPETITION_INFO } from '@/constants/competitionDetails';
import Header from '@/components/header';

/**
 * Competition Hub Page
 * 
 * Main landing page for the Sui Overflow 2025 competition prediction markets.
 * Shows all tracks, their descriptions, and links to individual markets.
 */
export default function CompetitionPage() {
  const totalProjects = COMPETITION_TRACKS.reduce((sum, track) => sum + track.projectCount, 0);
  
  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8 pt-36">
        {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 mb-4">
          <Trophy className="h-8 w-8 text-yellow-500" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sui Overflow 2025
          </h1>
        </div>
        <p className="text-xl text-gray-700 mb-6 max-w-3xl mx-auto">
          {COMPETITION_INFO.description}
        </p>
        
        {/* Competition Stats */}
        <div className="flex flex-wrap justify-center gap-6 mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Trophy className="h-4 w-4" />
            <span>{COMPETITION_INFO.totalTracks} Tracks</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Users className="h-4 w-4" />
            <span>{totalProjects} Projects</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="h-4 w-4" />
            <span>Live until June 25</span>
          </div>
        </div>

        {/* Timeline */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-8 max-w-4xl mx-auto">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Competition Timeline</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="font-medium text-green-600">📊 Prediction Phase</div>
              <div className="text-gray-700">June 12 - June 18, 2025</div>
              <div className="text-gray-600">Place your bets on track winners</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm">
              <div className="font-medium text-blue-600">🏆 Resolution Phase</div>
              <div className="text-gray-700">June 25, 2025</div>
              <div className="text-gray-600">Results announced & markets resolved</div>
            </div>
          </div>
        </div>
      </div>

      {/* Competition Tracks Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6 text-center">Competition Tracks</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {COMPETITION_TRACKS.map((track) => (
            <Card 
              key={track.id} 
              className="hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-200"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{track.name}</CardTitle>
                  <Badge variant="secondary" className="text-xs">
                    {track.projectCount} projects
                  </Badge>
                </div>
                <CardDescription className="text-sm">
                  {track.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {/* Projects Preview */}
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-2">Competing Projects:</div>
                    <div className="flex flex-wrap gap-1">
                      {track.projects.slice(0, 3).map((project) => (
                        <Badge key={project.id} variant="outline" className="text-xs px-2 py-1">
                          {project.name}
                        </Badge>
                      ))}
                      {track.projects.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-1">
                          +{track.projects.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 pt-2">
                    <Link href={`/prediction?market=${track.marketId}`} className="flex-1">
                      <Button className="w-full text-sm">
                        View Market
                      </Button>
                    </Link>
                    <Link href={`/competition/track/${track.id}`}>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* How to Participate Section */}
      <div className="bg-white rounded-lg p-8 mb-8 shadow-lg border">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-900">How to Participate</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-bold text-blue-600">1</span>
            </div>
            <h3 className="font-semibold mb-2 text-gray-900">Choose a Track</h3>
            <p className="text-sm text-gray-700">
              Select which competition track interests you most and explore the competing projects.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-bold text-green-600">2</span>
            </div>
            <h3 className="font-semibold mb-2 text-gray-900">Make Predictions</h3>
            <p className="text-sm text-gray-700">
              Purchase shares in the project you think will win. Higher conviction = bigger potential returns.
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-lg font-bold text-yellow-600">3</span>
            </div>
            <h3 className="font-semibold mb-2 text-gray-900">Claim Rewards</h3>
            <p className="text-sm text-gray-700">
              When markets resolve on June 25th, collect your winnings if you predicted correctly!
            </p>
          </div>
        </div>
      </div>

      {/* External Links */}
      <div className="text-center">
        <div className="space-y-3">
          <p className="text-sm text-gray-700">
            Learn more about the Sui Overflow hackathon
          </p>
          <Button variant="outline" asChild>
            <a 
              href={COMPETITION_INFO.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2"
            >
              Visit Sui.io/overflow
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </div>
    </div>
  );
}
