'use client';

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

interface AlertModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    variant?: 'success' | 'error' | 'info';
    buttonText?: string;
}

export function AlertModal({
    open,
    onClose,
    title,
    description,
    variant = 'info',
    buttonText = 'Close'
}: AlertModalProps) {
    const Icon = variant === 'success'
        ? CheckCircle2
        : variant === 'error'
            ? AlertCircle
            : Info;

    const iconColor = variant === 'success'
        ? 'text-green-500'
        : variant === 'error'
            ? 'text-red-500'
            : 'text-blue-500';

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 ${iconColor}`} />
                        {title}
                    </DialogTitle>
                    <DialogDescription>
                        {description}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={onClose}>
                        {buttonText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
