import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { verifyToken } from '@/lib/auth'
import { PrismaClient } from '@prisma/client'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const prisma = new PrismaClient()

function fallbackRecommendations(genres: string, authors: string, themes: string) {
  const bookList = [
    {
      title: "To Kill a Mockingbird",
      author: "Harper Lee",
      description: "A classic novel dealing with racial injustice and moral growth in the American South.",
      genres: ["Fiction", "Classic", "Coming-of-age"],
      themes: ["Racism", "Injustice", "Childhood"]
    },
    {
      title: "1984",
      author: "George Orwell",
      description: "A dystopian novel exploring themes of totalitarianism and surveillance.",
      genres: ["Science Fiction", "Dystopian", "Political Fiction"],
      themes: ["Totalitarianism", "Surveillance", "Manipulation"]
    },
    {
      title: "Pride and Prejudice",
      author: "Jane Austen",
      description: "A romantic novel examining societal expectations and personal growth.",
      genres: ["Classic", "Romance", "Satire"],
      themes: ["Love", "Class", "Marriage"]
    },
    {
      title: "The Hitchhiker's Guide to the Galaxy",
      author: "Douglas Adams",
      description: "A humorous science fiction series full of absurd adventures and social commentary.",
      genres: ["Science Fiction", "Comedy", "Adventure"],
      themes: ["Absurdism", "Technology", "Exploration"]
    },
    {
      title: "The Alchemist",
      author: "Paulo Coelho",
      description: "A philosophical novel about following one's dreams and finding one's destiny.",
      genres: ["Fiction", "Fantasy", "Quest"],
      themes: ["Self-discovery", "Destiny", "Spirituality"]
    }
  ]

  const userGenres = genres.toLowerCase().split(',').map(g => g.trim())
  const userAuthors = authors.toLowerCase().split(',').map(a => a.trim())
  const userThemes = themes.toLowerCase().split(',').map(t => t.trim())

  const recommendedBooks = bookList
    .filter(book => 
      book.genres.some(g => userGenres.includes(g.toLowerCase())) ||
      userAuthors.includes(book.author.toLowerCase()) ||
      book.themes.some(t => userThemes.includes(t.toLowerCase()))
    )
    .slice(0, 5)

  if (recommendedBooks.length === 0) {
    recommendedBooks.push(...bookList.slice(0, 5))
  }

  return recommendedBooks.map((book, index) => 
    `${index + 1}. "${book.title}" by ${book.author}
       ${book.description}`
  ).join('\n\n')
}



export async function POST(req: Request) {
  const token = req.headers.get('Authorization')?.split(' ')[1]
  const user = token ? verifyToken(token) : null

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { genres, authors, themes } = await req.json()

  const prompt = `Based on the following preferences, recommend 5 books:
  Genres: ${genres}
  Authors: ${authors}
  Themes: ${themes}

  For each book, provide the title, author, and a brief description. Format the response as a numbered list.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    })

    const recommendations = completion.choices[0].message.content

    // Save recommendation to database
    await prisma.recommendation.create({
      data: {
        userId: user.userId,
        genres: genres,
        authors: authors,
        themes: themes,
        books: recommendations || '',
      },
    })

    return NextResponse.json({ recommendations, fallback: false })
  } catch (error) {
    console.error('OpenAI API error:', error)
    const fallbackRecommendation = fallbackRecommendations(genres, authors, themes)

    // Save fallback recommendation to database
    await prisma.recommendation.create({
      data: {
        userId: user.userId,
        genres: genres,
        authors: authors,
        themes: themes,
        books: fallbackRecommendation,
      },
    })

    return NextResponse.json({ recommendations: fallbackRecommendation, fallback: true })
  }
}