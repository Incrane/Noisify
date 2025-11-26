"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Users, Clock, Search, Filter, BookOpen, ArrowUpDown, MoreHorizontal, Calendar } from "lucide-react";

interface Course {
    course_id: string;
    kursnamn: string;
    agande_organisation: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
    langd_timmar: number | null;
    antal_inskrivna: number | null;
    skapad_datum: string;
}

interface CourseListClientProps {
    initialCourses: Course[];
}

type SortField = 'kursnamn' | 'skapad_datum' | 'status' | 'antal_inskrivna';
type SortDirection = 'asc' | 'desc';

export default function CourseListClient({ initialCourses }: CourseListClientProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");
    const [sortField, setSortField] = useState<SortField>('skapad_datum');
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const filteredAndSortedCourses = initialCourses
        .filter((course) => {
            const matchesSearch = course.kursnamn.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === "ALL" || course.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            let comparison = 0;
            switch (sortField) {
                case 'kursnamn':
                    comparison = a.kursnamn.localeCompare(b.kursnamn);
                    break;
                case 'status':
                    comparison = a.status.localeCompare(b.status);
                    break;
                case 'antal_inskrivna':
                    comparison = (a.antal_inskrivna || 0) - (b.antal_inskrivna || 0);
                    break;
                case 'skapad_datum':
                    comparison = new Date(a.skapad_datum).getTime() - new Date(b.skapad_datum).getTime();
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />;
        return <ArrowUpDown className={`w-3 h-3 text-indigo-600 ${sortDirection === 'desc' ? 'rotate-180' : ''} transition-transform`} />;
    };

    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Kurser</h1>
                    <p className="text-slate-500 mt-1">Hantera och skapa nya kurser för din organisation.</p>
                </div>
                <Link
                    href="/staff/kurser/new"
                    className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md hover:shadow-indigo-200 active:scale-95"
                >
                    <Plus className="w-5 h-5" />
                    Skapa ny kurs
                </Link>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Sök efter kurs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer font-medium text-slate-700"
                    >
                        <option value="ALL">Alla statusar</option>
                        <option value="PUBLISHED">Publicerad</option>
                        <option value="DRAFT">Utkast</option>
                        <option value="ARCHIVED">Arkiverad</option>
                    </select>
                    <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    {/* Desktop Table */}
                    <table className="w-full text-left text-sm hidden md:table">
                        <thead className="bg-slate-50/80 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-500 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('kursnamn')}>
                                    <div className="flex items-center gap-2">
                                        Kurs
                                        <SortIcon field="kursnamn" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-500 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('status')}>
                                    <div className="flex items-center gap-2">
                                        Status
                                        <SortIcon field="status" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-500">Längd</th>
                                <th className="px-6 py-4 font-semibold text-slate-500 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('antal_inskrivna')}>
                                    <div className="flex items-center gap-2">
                                        Deltagare
                                        <SortIcon field="antal_inskrivna" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-500 cursor-pointer group hover:bg-slate-100 transition-colors" onClick={() => handleSort('skapad_datum')}>
                                    <div className="flex items-center gap-2">
                                        Skapad
                                        <SortIcon field="skapad_datum" />
                                    </div>
                                </th>
                                <th className="px-6 py-4 font-semibold text-slate-500 text-right">Åtgärd</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredAndSortedCourses.map((course) => (
                                <tr key={course.course_id} className="hover:bg-slate-50/80 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-slate-900 text-base">{course.kursnamn}</div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                            {course.agande_organisation}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm
                                            ${course.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                course.status === 'DRAFT' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                    'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                                                ${course.status === 'PUBLISHED' ? 'bg-emerald-500' :
                                                    course.status === 'DRAFT' ? 'bg-slate-400' :
                                                        'bg-amber-500'}`}></span>
                                            {course.status === 'PUBLISHED' ? 'Publicerad' :
                                                course.status === 'DRAFT' ? 'Utkast' : 'Arkiverad'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            {course.langd_timmar ? `${course.langd_timmar}h` : '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span>{course.antal_inskrivna || 0}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        <div className="flex items-center gap-2" title={new Date(course.skapad_datum).toLocaleString()}>
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {new Date(course.skapad_datum).toLocaleDateString('sv-SE')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/staff/kurser/${course.course_id}`}
                                            className="inline-flex items-center justify-center px-3 py-1.5 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium text-sm transition-colors"
                                        >
                                            Hantera
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                            {filteredAndSortedCourses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-24 text-center">
                                        <div className="flex flex-col items-center justify-center text-slate-500 max-w-sm mx-auto">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                                <BookOpen className="w-8 h-8 text-slate-300" />
                                            </div>
                                            <h3 className="font-bold text-slate-900 text-lg mb-1">Inga kurser hittades</h3>
                                            <p className="text-slate-500 text-sm mb-6">
                                                {searchQuery || statusFilter !== 'ALL'
                                                    ? "Inga kurser matchar din sökning eller filter. Prova att justera dem."
                                                    : "Du har inte skapat några kurser än. Kom igång genom att skapa din första kurs."}
                                            </p>
                                            {initialCourses.length === 0 && !searchQuery && statusFilter === 'ALL' && (
                                                <Link
                                                    href="/staff/kurser/new"
                                                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
                                                >
                                                    Skapa din första kurs
                                                </Link>
                                            )}
                                            {(searchQuery || statusFilter !== 'ALL') && (
                                                <button
                                                    onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                                                    className="text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline"
                                                >
                                                    Rensa filter
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Mobile Card View */}
                    <div className="md:hidden divide-y divide-slate-100">
                        {filteredAndSortedCourses.map((course) => (
                            <div key={course.course_id} className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-semibold text-slate-900 text-base">{course.kursnamn}</div>
                                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                                            {course.agande_organisation}
                                        </div>
                                    </div>
                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border shadow-sm
                                        ${course.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                            course.status === 'DRAFT' ? 'bg-slate-100 text-slate-600 border-slate-200' :
                                                'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 
                                            ${course.status === 'PUBLISHED' ? 'bg-emerald-500' :
                                                course.status === 'DRAFT' ? 'bg-slate-400' :
                                                    'bg-amber-500'}`}></span>
                                        {course.status === 'PUBLISHED' ? 'Publicerad' :
                                            course.status === 'DRAFT' ? 'Utkast' : 'Arkiverad'}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Clock className="w-4 h-4 text-slate-400" />
                                            {course.langd_timmar ? `${course.langd_timmar}h` : '-'}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-600">
                                            <Users className="w-4 h-4 text-slate-400" />
                                            <span>{course.antal_inskrivna || 0} deltagare</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-slate-500" title={new Date(course.skapad_datum).toLocaleString()}>
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            {new Date(course.skapad_datum).toLocaleDateString('sv-SE')}
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 flex justify-end">
                                    <Link
                                        href={`/staff/kurser/${course.course_id}`}
                                        className="inline-flex items-center justify-center px-4 py-2 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg font-medium text-sm transition-colors w-full bg-indigo-50"
                                    >
                                        Hantera
                                    </Link>
                                </div>
                            </div>
                        ))}
                        {filteredAndSortedCourses.length === 0 && (
                            <div className="p-8 text-center">
                                <div className="flex flex-col items-center justify-center text-slate-500 max-w-sm mx-auto">
                                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 border border-slate-100">
                                        <BookOpen className="w-8 h-8 text-slate-300" />
                                    </div>
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">Inga kurser hittades</h3>
                                    <p className="text-slate-500 text-sm mb-6">
                                        {searchQuery || statusFilter !== 'ALL'
                                            ? "Inga kurser matchar din sökning eller filter. Prova att justera dem."
                                            : "Du har inte skapat några kurser än. Kom igång genom att skapa din första kurs."}
                                    </p>
                                    {initialCourses.length === 0 && !searchQuery && statusFilter === 'ALL' && (
                                        <Link
                                            href="/staff/kurser/new"
                                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md"
                                        >
                                            Skapa din första kurs
                                        </Link>
                                    )}
                                    {(searchQuery || statusFilter !== 'ALL') && (
                                        <button
                                            onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                                            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm hover:underline"
                                        >
                                            Rensa filter
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
