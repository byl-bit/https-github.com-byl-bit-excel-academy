'use client';

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResultFiltersProps {
    grades: string[];
    sections: string[];
    filterGrade: string;
    setFilterGrade: (v: string) => void;
    filterSection: string;
    setFilterSection: (v: string) => void;
    filterGender: string;
    setFilterGender: (v: string) => void;
    filterStatus: string;
    setFilterStatus: (v: string) => void;
    search: string;
    setSearch: (v: string) => void;
    onReset: () => void;
}

export function ResultFilters({
    grades,
    sections,
    filterGrade,
    setFilterGrade,
    filterSection,
    setFilterSection,
    filterGender,
    setFilterGender,
    filterStatus,
    setFilterStatus,
    search,
    setSearch,
    onReset
}: ResultFiltersProps) {
    return (
        <div className="glass-panel p-6 rounded-3xl bg-white shadow-sm border border-slate-100 space-y-6">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-blue-600" />
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Active Filters</h3>
                </div>
                <Button variant="ghost" size="sm" onClick={onReset} className="h-8 text-[10px] font-black text-slate-400 hover:text-red-500 uppercase tracking-widest gap-2">
                    <X className="h-3 w-3" /> Reset All
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grade Level</Label>
                    <select
                        className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer transition-all hover:bg-white"
                        value={filterGrade}
                        onChange={e => setFilterGrade(e.target.value)}
                    >
                        <option value="">All Grades</option>
                        {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Section</Label>
                    <select
                        className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer transition-all hover:bg-white"
                        value={filterSection}
                        onChange={e => setFilterSection(e.target.value)}
                    >
                        <option value="">All Sections</option>
                        {sections.map(s => <option key={s} value={s}>Section {s}</option>)}
                    </select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gender</Label>
                    <select
                        className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer transition-all hover:bg-white"
                        value={filterGender}
                        onChange={e => setFilterGender(e.target.value)}
                    >
                        <option value="">Any Gender</option>
                        <option value="M">Male</option>
                        <option value="F">Female</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Outcome</Label>
                    <select
                        className="w-full h-11 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-blue-100 outline-none cursor-pointer transition-all hover:bg-white"
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                    >
                        <option value="">All Decisions</option>
                        <option value="PROMOTED">PROMOTED</option>
                        <option value="DETAINED">DETAINED</option>
                    </select>
                </div>

                <div className="space-y-1.5">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quick Search</Label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
                        <Input
                            placeholder="Name, ID, Roll..."
                            className="pl-11 h-11 rounded-2xl border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-blue-100 font-bold text-sm transition-all hover:bg-white"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
