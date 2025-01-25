'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {  Book, LogIn, UserPlus } from 'lucide-react'

export default function Home() {
  const [page, setPage] = useState<'landing' | 'auth' | 'recommend'>('landing')
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [genres, setGenres] = useState('')
  const [authors, setAuthors] = useState('')
  const [themes, setThemes] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [loading, setLoading] = useState(false)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isFallback, setIsFallback] = useState(false)

  const handleAuth = async (type: 'login' | 'register') => {
    try {
      const response = await fetch(`/api/auth/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        console.error('Authentication error:', errorData)
        return
      }
      
      const data = await response.json()
      if (data.token) {
        localStorage.setItem('token', data.token)
        setIsLoggedIn(true)
        setPage('recommend')
      }
    } catch (error) {
      console.error('Authentication error:', error)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setPage('landing')
    setRecommendations('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setRecommendations('')
    setIsFallback(false)

    const token = localStorage.getItem('token')
    const response = await fetch('/api/recommend', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ genres, authors, themes }),
    })

    const data = await response.json()
    setRecommendations(data.recommendations)
    setIsFallback(data.fallback)
    setLoading(false)
  }

  return (
    <main className="container mx-auto p-4 min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {page === 'landing' && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-3xl font-bold text-center">Book Recommender</CardTitle>
            <CardDescription className="text-center">Discover your next favorite read</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={() => setPage('auth')} className="w-full">
              <LogIn className="mr-2 h-4 w-4" /> Get Started
            </Button>
          </CardContent>
        </Card>
      )}

      {page === 'auth' && (
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
            <CardDescription className="text-center">Login or create an account</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <form onSubmit={(e) => { e.preventDefault(); handleAuth('login'); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full">
                    <LogIn className="mr-2 h-4 w-4" /> Login
                  </Button>
                </form>
              </TabsContent>
              <TabsContent value="register">
                <form onSubmit={(e) => { e.preventDefault(); handleAuth('register'); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="reg-username">Username</Label>
                    <Input id="reg-username" type="text" required value={username} onChange={(e) => setUsername(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password</Label>
                    <Input id="reg-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full">
                    <UserPlus className="mr-2 h-4 w-4" /> Register
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {page === 'recommend' && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Book Recommendations</CardTitle>
            <CardDescription>Tell us your preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="genres">Favorite Genres</Label>
                <Input id="genres" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="e.g., Science Fiction, Mystery, Romance" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="authors">Favorite Authors</Label>
                <Input id="authors" value={authors} onChange={(e) => setAuthors(e.target.value)} placeholder="e.g., Jane Austen, George Orwell, Agatha Christie" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="themes">Preferred Themes or Topics</Label>
                <Input id="themes" value={themes} onChange={(e) => setThemes(e.target.value)} placeholder="e.g., Time Travel, Coming of Age, Political Intrigue" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Getting Recommendations...' : 'Get Recommendations'}
              </Button>
            </form>


            {recommendations && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold flex items-center">
                  <Book className="mr-2" /> Your Recommendations
                </h3>
                <Textarea value={recommendations} readOnly className="w-full h-64" />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
          </CardFooter>
        </Card>
      )}
    </main>
  )
}