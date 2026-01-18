'use client';

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, Send, MessageCircle } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Store contact form submission in localStorage
        const submissions = JSON.parse(localStorage.getItem('contact_submissions') || '[]');
        submissions.push({
            ...formData,
            timestamp: new Date().toISOString()
        });
        localStorage.setItem('contact_submissions', JSON.stringify(submissions));
        setSubmitted(true);
        setTimeout(() => {
            setSubmitted(false);
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        }, 3000);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }));
    };

    return (
        <div className="flex flex-col min-h-screen">
            {/* Hero Section */}
            <section className="relative bg-linear-to-br from-slate-900 via-blue-900 to-slate-900 text-white py-20">
                <div className="absolute inset-0 bg-[url('/hero-banner.png')] opacity-10 bg-cover bg-center"></div>
                <div className="container relative z-10 px-6 text-center">
                    <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Get in Touch</h1>
                    <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto">
                        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>
                </div>
            </section>

            {/* Contact Information Cards */}
            <section className="py-16 bg-slate-50">
                <div className="container px-6">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MapPin className="w-7 h-7 text-blue-600" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Visit Us</h3>
                                <p className="text-sm text-slate-600">
                                    Excel Academy WDD<br />
                                    Addis Ababa, Ethiopia
                                </p>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Phone className="w-7 h-7 text-green-600" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Call Us</h3>
                                <a href="tel:+251964324390" className="text-sm text-slate-600 hover:text-green-600 transition-colors">
                                    +251 964 324 390
                                </a>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="w-14 h-14 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Mail className="w-7 h-7 text-purple-600" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Email Us</h3>
                                <a href="mailto:mrictwise@gmail.com" className="text-sm text-slate-600 hover:text-purple-600 transition-colors">
                                    mrictwise@gmail.com
                                </a>
                            </CardContent>
                        </Card>

                        <Card className="border-none shadow-lg hover:shadow-xl transition-shadow">
                            <CardContent className="p-6 text-center">
                                <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="w-7 h-7 text-orange-600" />
                                </div>
                                <h3 className="font-bold text-lg mb-2">Office Hours</h3>
                                <p className="text-sm text-slate-600">
                                    Mon - Fri: 8:00 AM - 5:00 PM<br />
                                    Sat: 9:00 AM - 1:00 PM
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Contact Form */}
                    <div className="max-w-3xl mx-auto">
                        <Card className="border-none shadow-2xl">
                            <CardContent className="p-8 md:p-12">
                                <div className="text-center mb-8">
                                    <h2 className="text-3xl font-bold text-slate-900 mb-3">Send Us a Message</h2>
                                    <p className="text-slate-600">Fill out the form below and we'll get back to you shortly</p>
                                </div>

                                {submitted ? (
                                    <div className="bg-green-50 border border-green-200 rounded-lg p-6 text-center">
                                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <Send className="w-8 h-8 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                                        <p className="text-green-700">Thank you for contacting us. We'll respond within 24 hours.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="name" className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Full Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    id="name"
                                                    name="name"
                                                    required
                                                    value={formData.name}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="John Doe"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="email" className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Email Address *
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    required
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="john@example.com"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div>
                                                <label htmlFor="phone" className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Phone Number
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="phone"
                                                    name="phone"
                                                    value={formData.phone}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="+251 912 345 678"
                                                />
                                            </div>

                                            <div>
                                                <label htmlFor="subject" className="block text-sm font-semibold text-slate-700 mb-2">
                                                    Subject *
                                                </label>
                                                <input
                                                    type="text"
                                                    id="subject"
                                                    name="subject"
                                                    required
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                                    placeholder="Admission Inquiry"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="message" className="block text-sm font-semibold text-slate-700 mb-2">
                                                Message *
                                            </label>
                                            <textarea
                                                id="message"
                                                name="message"
                                                required
                                                value={formData.message}
                                                onChange={handleChange}
                                                rows={6}
                                                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                                placeholder="Tell us how we can help you..."
                                            />
                                        </div>

                                        <Button
                                            type="submit"
                                            size="lg"
                                            className="w-full h-14 text-base font-bold rounded-lg bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Send className="mr-2 h-5 w-5" />
                                            Send Message
                                        </Button>
                                    </form>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* WhatsApp CTA */}
                    <div className="mt-12 text-center">
                        <p className="text-slate-600 mb-4">Prefer instant messaging?</p>
                        <Button
                            asChild
                            size="lg"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-full px-8 shadow-lg hover:shadow-xl transition-all"
                        >
                            <a href="https://wa.me/251964324390" target="_blank" rel="noopener noreferrer">
                                <MessageCircle className="mr-2 h-5 w-5" />
                                Chat on WhatsApp
                            </a>
                        </Button>
                    </div>
                </div>
            </section>
        </div>
    );
}
