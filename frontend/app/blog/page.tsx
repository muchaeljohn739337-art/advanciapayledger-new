'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function BlogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', name: 'All Posts' },
    { id: 'payments', name: 'Payments' },
    { id: 'healthcare', name: 'Healthcare' },
    { id: 'technology', name: 'Technology' },
    { id: 'security', name: 'Security' },
  ];

  const posts = [
    {
      id: 1,
      title: 'The Future of Healthcare Payments: Crypto Integration',
      excerpt: 'Exploring how cryptocurrency is revolutionizing healthcare payment processing and what it means for medical facilities.',
      category: 'payments',
      author: 'Sarah Chen',
      date: '2024-01-15',
      readTime: '5 min read',
      image: '💳',
    },
    {
      id: 2,
      title: 'HIPAA Compliance in Digital Payment Systems',
      excerpt: 'Understanding the critical importance of HIPAA compliance when implementing digital payment solutions in healthcare.',
      category: 'security',
      author: 'Dr. Emily Watson',
      date: '2024-01-12',
      readTime: '7 min read',
      image: '🔒',
    },
    {
      id: 3,
      title: 'Reducing Administrative Burden with Smart Payments',
      excerpt: 'How modern payment systems can significantly reduce the administrative overhead in healthcare facilities.',
      category: 'healthcare',
      author: 'Marcus Rodriguez',
      date: '2024-01-10',
      readTime: '4 min read',
      image: '🏥',
    },
    {
      id: 4,
      title: 'Blockchain Technology in Medical Billing',
      excerpt: 'A deep dive into how blockchain technology is transforming medical billing and patient data management.',
      category: 'technology',
      author: 'James Park',
      date: '2024-01-08',
      readTime: '6 min read',
      image: '⛓️',
    },
    {
      id: 5,
      title: 'Patient Experience: The Payment Revolution',
      excerpt: 'Improving patient satisfaction through streamlined payment processes and transparent billing.',
      category: 'healthcare',
      author: 'Sarah Chen',
      date: '2024-01-05',
      readTime: '5 min read',
      image: '😊',
    },
    {
      id: 6,
      title: 'Security Best Practices for Healthcare Payments',
      excerpt: 'Essential security measures every healthcare facility should implement for their payment systems.',
      category: 'security',
      author: 'James Park',
      date: '2024-01-03',
      readTime: '8 min read',
      image: '🛡️',
    },
  ];

  const filteredPosts = selectedCategory === 'all' 
    ? posts 
    : posts.filter(post => post.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600">Advancia Pay</Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/playground" className="text-gray-700 hover:text-blue-600">Playground</Link>
              <Link href="/features" className="text-gray-700 hover:text-blue-600">Features</Link>
              <Link href="/pricing" className="text-gray-700 hover:text-blue-600">Pricing</Link>
              <Link href="/login" className="text-gray-700 hover:text-blue-600">Login</Link>
              <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Advancia Pay<br />
            <span className="text-blue-600">Blog</span>
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Insights, trends, and best practices in healthcare payments, 
            technology, and security. Stay informed with our expert analysis.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white rounded-lg shadow-md p-1">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Blog Posts Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredPosts.map((post) => (
            <article key={post.id} className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-4xl">{post.image}</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-medium">
                    {categories.find(c => c.id === post.category)?.name}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {post.title}
                </h3>
                
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {post.excerpt}
                </p>
                
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center space-x-2">
                    <span>{post.author}</span>
                    <span>•</span>
                    <span>{post.readTime}</span>
                  </div>
                  <span>{new Date(post.date).toLocaleDateString()}</span>
                </div>
                
                <Link 
                  href={`/blog/${post.id}`}
                  className="inline-flex items-center text-blue-600 font-semibold hover:text-blue-700"
                >
                  Read More →
                </Link>
              </div>
            </article>
          ))}
        </div>

        {/* Newsletter Signup */}
        <div className="bg-blue-600 rounded-2xl p-12 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Get the latest insights on healthcare payments, technology trends, and industry news delivered to your inbox.
          </p>
          <div className="max-w-md mx-auto flex gap-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 px-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
            <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100">
              Subscribe
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="font-bold text-lg mb-4">Advancia Pay</h3>
              <p className="text-gray-400">Healthcare payments reimagined</p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features">Features</Link></li>
                <li><Link href="/pricing">Pricing</Link></li>
                <li><Link href="/security">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about">About</Link></li>
                <li><Link href="/blog">Blog</Link></li>
                <li><Link href="/contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/privacy">Privacy</Link></li>
                <li><Link href="/terms">Terms</Link></li>
                <li><Link href="/compliance">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            © 2026 Advancia Pay Ledger. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
