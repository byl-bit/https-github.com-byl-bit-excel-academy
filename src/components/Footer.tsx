import { Mail, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export function Footer() {
    return (
        <footer className="border-t bg-white py-8">
            <div className="container mx-auto px-4 max-w-[1920px]">
                <div className="grid md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <h3 className="font-bold text-lg mb-4">Excel Academy WDD</h3>
                        <p className="text-sm text-muted-foreground">
                            Excellence in Education. Empowering students for a brighter future.
                        </p>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Contact Admin</h3>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <a href="mailto:mrictwise@gmail.com" className="flex items-center gap-2 hover:text-primary transition-colors">
                                <Mail className="h-4 w-4" />
                                mrictwise@gmail.com
                            </a>
                            <a href="https://wa.me/251964324390" className="flex items-center gap-2 hover:text-green-600 transition-colors">
                                <MessageCircle className="h-4 w-4" />
                                +251 964 324 390
                            </a>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg mb-4">Quick Links</h3>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                            <Link href="/" className="hover:underline">Home</Link>
                            <Link href="/announcements" className="hover:underline">Announcements</Link>
                            <Link href="/auth/login" className="hover:underline">Login</Link>
                        </div>
                    </div>
                </div>
                <div className="text-center text-xs text-muted-foreground border-t pt-4">
                    <p>&copy; {new Date().getFullYear()} Excel Academy WDD. All rights reserved.</p>
                    <p className="mt-1 font-semibold">Made by B.Y.L</p>
                </div>
            </div>
        </footer>
    );
}
