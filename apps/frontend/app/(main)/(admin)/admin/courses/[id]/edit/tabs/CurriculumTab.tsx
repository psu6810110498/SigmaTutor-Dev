"use client";

import { useState } from "react";
import {
    Plus,
    Pencil,
    Trash2,
    Video,
    FileText,
    HelpCircle,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { chapterApi, lessonApi } from "@/app/lib/api";
import type { Course } from "@/app/lib/types";
import { useToast } from "@/app/components/ui/Toast";
import { ConfirmDialog } from "@/app/components/ui/ConfirmDialog";
import { Input } from "@/app/components/ui/Input";
import { Button } from "@/app/components/ui/Button";

interface CurriculumTabProps {
    course: Course;
    onUpdate: () => void;
}

export function CurriculumTab({ course, onUpdate }: CurriculumTabProps) {
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);

    // State
    const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});
    const [isAddingChapter, setIsAddingChapter] = useState(false);
    const [newChapterTitle, setNewChapterTitle] = useState("");

    // Editing State
    const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
    const [editChapterTitle, setEditChapterTitle] = useState("");

    const [addingLessonToChapterId, setAddingLessonToChapterId] = useState<string | null>(null);
    const [newLessonTitle, setNewLessonTitle] = useState("");
    const [newLessonType, setNewLessonType] = useState<"VIDEO" | "FILE" | "QUIZ">("VIDEO");

    const [confirmDelete, setConfirmDelete] = useState<{
        type: "CHAPTER" | "LESSON";
        id: string;
        title: string;
    } | null>(null);

    // Handlers
    const toggleChapter = (id: string) => {
        setExpandedChapters(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const handleAddChapter = async () => {
        if (!newChapterTitle.trim()) return;
        setLoading(true);
        try {
            const res = await chapterApi.create({
                courseId: course.id,
                title: newChapterTitle,
                order: (course.chapters?.length || 0) + 1
            });
            if (res.success) {
                toast.success("เพิ่มบทเรียนเรียบร้อย");
                setNewChapterTitle("");
                setIsAddingChapter(false);
                onUpdate();
            } else {
                toast.error(res.error || "Failed to create chapter");
            }
        } catch (error) {
            toast.error("Error creating chapter");
        } finally {
            setLoading(false);
        }
    };

    const handleEditChapter = async (id: string) => {
        if (!editChapterTitle.trim()) return;
        setLoading(true);
        try {
            const res = await chapterApi.update(id, { title: editChapterTitle });
            if (res.success) {
                toast.success("บันทึกการแก้ไขเรียบร้อย");
                setEditingChapterId(null);
                onUpdate();
            } else {
                toast.error(res.error || "Failed to update");
            }
        } catch (error) {
            toast.error("Update failed");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!confirmDelete) return;
        setLoading(true);
        try {
            const api = confirmDelete.type === "CHAPTER" ? chapterApi : lessonApi;
            // @ts-ignore
            const res = await api.delete(confirmDelete.id);
            // void response
            toast.success("ลบเรียบร้อย");
            setConfirmDelete(null);
            onUpdate();
        } catch (error) {
            toast.error("Delete failed");
        } finally {
            setLoading(false);
        }
    };

    const handleAddLesson = async (chapterId: string) => {
        if (!newLessonTitle.trim()) return;
        setLoading(true);
        try {
            const res = await lessonApi.create({
                chapterId,
                title: newLessonTitle,
                type: newLessonType,
                order: (course.chapters?.find(c => c.id === chapterId)?.lessons?.length || 0) + 1
            });
            if (res.success) {
                toast.success("เพิ่มเนื้อหาเรียบร้อย");
                setNewLessonTitle("");
                setAddingLessonToChapterId(null);
                onUpdate();
                // Expand the chapter
                setExpandedChapters(prev => ({ ...prev, [chapterId]: true }));
            } else {
                toast.error(res.error || "Failed to create lesson");
            }
        } catch (error) {
            toast.error("Error creating lesson");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">เนื้อหาบทเรียน</h2>
                <Button onClick={() => setIsAddingChapter(true)} disabled={loading || isAddingChapter}>
                    <Plus size={16} className="mr-2" /> เพิ่มบทเรียน
                </Button>
            </div>

            {/* Add Chapter Inline Form */}
            {isAddingChapter && (
                <div className="bg-gray-50 border rounded-lg p-4 animate-fade-in-up">
                    <h4 className="font-medium mb-3 text-sm text-gray-700">เพิ่มบทเรียนใหม่</h4>
                    <div className="flex gap-2">
                        <Input
                            autoFocus
                            placeholder="ชื่อบทเรียน (เช่น บทนำ, พื้นฐาน)"
                            value={newChapterTitle}
                            onChange={(e) => setNewChapterTitle(e.target.value)}
                        />
                        <Button onClick={handleAddChapter} disabled={loading || !newChapterTitle.trim()}>
                            บันทึก
                        </Button>
                        <Button variant="outline" onClick={() => setIsAddingChapter(false)}>
                            ยกเลิก
                        </Button>
                    </div>
                </div>
            )}

            {/* Chapters List */}
            <div className="space-y-4">
                {course.chapters?.map((chapter) => (
                    <div key={chapter.id} className="border rounded-lg bg-white shadow-sm overflow-hidden">
                        {/* Chapter Header */}
                        <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                            <div className="flex items-center gap-3 flex-1">
                                <button onClick={() => toggleChapter(chapter.id)} className="text-gray-500 hover:text-gray-700">
                                    {expandedChapters[chapter.id] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </button>

                                {editingChapterId === chapter.id ? (
                                    <div className="flex gap-2 flex-1 max-w-md">
                                        <Input
                                            value={editChapterTitle}
                                            onChange={(e) => setEditChapterTitle(e.target.value)}
                                            autoFocus
                                        />
                                        <Button size="sm" onClick={() => handleEditChapter(chapter.id)}>บันทึก</Button>
                                        <Button size="sm" variant="outline" onClick={() => setEditingChapterId(null)}>ยกเลิก</Button>
                                    </div>
                                ) : (
                                    <h3 className="font-semibold text-gray-900">{chapter.title}</h3>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={() => setAddingLessonToChapterId(chapter.id)}>
                                    <Plus size={14} className="mr-1" /> เพิ่มเนื้อหา
                                </Button>
                                <div className="flex items-center border-l pl-2 ml-2 gap-1">
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50"
                                        onClick={() => {
                                            setEditingChapterId(chapter.id);
                                            setEditChapterTitle(chapter.title);
                                        }}
                                    >
                                        <Pencil size={16} />
                                    </button>
                                    <button
                                        className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                        onClick={() => setConfirmDelete({ type: 'CHAPTER', id: chapter.id, title: chapter.title })}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Add Lesson Form */}
                        {addingLessonToChapterId === chapter.id && (
                            <div className="p-4 bg-blue-50 border-b animate-fade-in">
                                <h5 className="text-sm font-medium text-blue-800 mb-2">เพิ่มเนื้อหาในบทเรียนนี้</h5>
                                <div className="flex gap-2 items-center">
                                    <select
                                        className="h-10 rounded-md border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        value={newLessonType}
                                        onChange={(e) => setNewLessonType(e.target.value as any)}
                                    >
                                        <option value="VIDEO">Video</option>
                                        <option value="FILE">File</option>
                                        <option value="QUIZ">Quiz</option>
                                    </select>
                                    <Input
                                        className="flex-1"
                                        placeholder="ชื่อเนื้อหา (เช่น วิดีโอแนะนำ)"
                                        value={newLessonTitle}
                                        onChange={(e) => setNewLessonTitle(e.target.value)}
                                        autoFocus
                                    />
                                    <Button size="sm" onClick={() => handleAddLesson(chapter.id)} disabled={loading || !newLessonTitle.trim()}>
                                        เพิ่ม
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setAddingLessonToChapterId(null)}>
                                        ยกเลิก
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Lessons List */}
                        {expandedChapters[chapter.id] && (
                            <div className="divide-y">
                                {chapter.lessons?.length > 0 ? (
                                    chapter.lessons.map((lesson) => (
                                        <div key={lesson.id} className="p-3 pl-12 hover:bg-gray-50 flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                {lesson.type === 'VIDEO' && <Video size={16} className="text-blue-500" />}
                                                {lesson.type === 'FILE' && <FileText size={16} className="text-orange-500" />}
                                                {lesson.type === 'QUIZ' && <HelpCircle size={16} className="text-purple-500" />}
                                                <span className="text-gray-700 text-sm">{lesson.title}</span>
                                            </div>
                                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {/* Edit Lesson would go here - keeping simple for now */}
                                                <button
                                                    className="p-1 text-gray-400 hover:text-red-600"
                                                    onClick={() => setConfirmDelete({ type: 'LESSON', id: lesson.id, title: lesson.title })}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-sm text-gray-400 italic">
                                        ไม่มีเนื้อหา
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <ConfirmDialog
                open={!!confirmDelete}
                title={confirmDelete ? `ลบ${confirmDelete.type === 'CHAPTER' ? 'บทเรียน' : 'เนื้อหา'}` : ""}
                message={confirmDelete ? `คุณยืนยันที่จะลบ "${confirmDelete.title}" ใช่หรือไม่?` : ""}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
                loading={loading}
            />
        </div>
    );
}
