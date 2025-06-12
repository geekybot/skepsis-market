import React from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ExternalLink, Play, Home, Twitter } from 'lucide-react';
import { getTrackById } from '@/constants/competitionDetails';
import Header from '@/components/header';

/**
 * Track Detail Page
 * 
 * Shows detailed information about a specific competition track,
 * including all competing projects with their logos, links, and descriptions.
 */
export default function TrackDetailPage() {
  const router = useRouter();
  const { trackId } = router.query;
  
  const track = typeof trackId === 'string' ? getTrackById(trackId) : null;

  if (!track) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8 pt-24">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4 text-gray-900">Track Not Found</h1>
            <p className="text-gray-700 mb-6">The competition track you're looking for doesn't exist.</p>
            <Link href="/competition">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Competition
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8 pt-24">
        {/* Header */}
      <div className="mb-8">
        <Link href="/competition" className="inline-flex items-center text-blue-600 hover:text-blue-800 mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Competition
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-white">{track.name} Track</h1>
            <p className="text-gray-200 text-lg mb-4">{track.description}</p>
            <div className="flex items-center gap-4">
              <Badge variant="secondary" className="text-sm">
                {track.projectCount} competing projects
              </Badge>
              
            </div>
          </div>
          
          <div className="text-right">
            <Link href={`/prediction?market=${track.marketId}`}>
              <Button size="lg" className="mb-2">
                View Prediction Market
              </Button>
            </Link>
            <p className="text-sm text-gray-300">
              Make your predictions
            </p>
          </div>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-6 text-white">Competing Projects</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {track.projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {project.logo && (
                        <img 
                          src={project.logo} 
                          alt={`${project.name} logo`}
                          className="w-8 h-8 rounded object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Position #{project.spreadIndex + 1}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Project Links */}
                  <div className="flex flex-wrap gap-2">
                    {project.homepage && (
                      <a 
                        href={project.homepage.startsWith('http') ? project.homepage : `https://${project.homepage}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        <Home className="h-3 w-3" />
                        Website
                      </a>
                    )}
                    
                    {project.demoVideo && (
                      <a 
                        href={project.demoVideo}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-800"
                      >
                        <Play className="h-3 w-3" />
                        Demo
                      </a>
                    )}
                    
                    {project.twitterPage && (
                      <a 
                        href={project.twitterPage}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-800"
                      >
                        <Twitter className="h-3 w-3" />
                        Twitter
                      </a>
                    )}
                  </div>

                  {/* Market Position Info */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <div className="text-xs font-medium text-gray-800 mb-1">
                      Market Position
                    </div>
                    <div className="text-sm text-gray-700">
                      Spread Range: {project.spreadIndex} - {project.spreadIndex + 1}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      This project wins if the final result falls in range {project.spreadIndex}-{project.spreadIndex + 1}
                    </div>
                  </div>

                  {/* Bet Button */}
                  <Link href={`/prediction?market=${track.marketId}&highlight=${project.spreadIndex}`}>
                    <Button variant="outline" className="w-full text-sm">
                      Bet on {project.name}
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Market Info Section */}
      <div className="bg-white rounded-lg p-6 shadow-lg border">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">How This Market Works</h3>
        <div className="grid md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2 text-gray-900">📊 Range-Based Prediction</h4>
            <p className="text-gray-700 mb-3">
              Each project is assigned a position (0-{track.projectCount - 1}). The market resolves based on which 
              project wins the track, determining the final range.
            </p>
          </div>
          <div>
            <h4 className="font-medium mb-2 text-gray-900">🏆 Resolution Criteria</h4>
            <p className="text-gray-700 mb-3">
              Markets resolve on June 25th based on official Sui Foundation announcements. 
              The winning project determines which spread range wins.
            </p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <Link href={`/prediction?market=${track.marketId}`}>
            <Button className="w-full md:w-auto">
              <ExternalLink className="h-4 w-4 mr-2" />
              View Full Market Details
            </Button>
          </Link>
        </div>
      </div>
    </div>
    </div>
  );
}
