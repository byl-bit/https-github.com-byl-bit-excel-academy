"use client";

import { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  Plus,
  Trash2,
  Lock,
  Download,
  Award,
  Users,
} from "lucide-react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { AlertModal } from "@/components/ui/alert-modal";

interface SettingsManagerProps {
  maintenanceMode: boolean;
  onToggleMaintenance: () => void;
  subjects: string[];
  onAddSubject: (s: string) => void;
  onDeleteSubject: (s: string) => void;
  onResetSystem: () => void;
  onChangeAdminPassword: (pass: string) => void;
  settings: any;
  onUpdateSettings: (key: string, value: any) => void;
}

export function SettingsManager({
  maintenanceMode,
  onToggleMaintenance,
  subjects,
  onAddSubject,
  onDeleteSubject,
  onResetSystem,
  onChangeAdminPassword,
  settings,
  onUpdateSettings,
}: SettingsManagerProps) {
  const [newSubject, setNewSubject] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mediaList, setMediaList] = useState<
    Array<{ name: string; url: string }>
  >([]);

  const [resultConfigForm, setResultConfigForm] = useState({
    semester: "1" as "1" | "2",
    label: "",
    maxMarks: 50,
  });

  const [localResultConfig, setLocalResultConfig] = useState<{
    "1": Array<{ id: string; label: string; maxMarks: number }>;
    "2": Array<{ id: string; label: string; maxMarks: number }>;
  }>({ "1": [], "2": [] });

  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (settings?.resultConfig) {
      setLocalResultConfig(settings.resultConfig);
    }
  }, [settings?.resultConfig]);

  const handleAddResultConfig = () => {
    if (!resultConfigForm.label.trim()) return;

    const currentConfig = settings?.resultConfig || {};
    const semester = resultConfigForm.semester;
    const semesterList = [...(currentConfig[semester] || [])];

    const labelLower = resultConfigForm.label.trim().toLowerCase();
    const exists = semesterList.some((c: any) => c.label.toLowerCase() === labelLower);
    if (exists) {
      setAlert({
        open: true,
        title: "Duplicate Component",
        description: `A component with label "${resultConfigForm.label}" already exists for Semester ${semester}.`,
        variant: "error",
      });
      return;
    }

    const newComponent = {
      id: `comp-${labelLower.replace(/[^a-z0-9]/g, "")}-${Date.now()}`,
      label: resultConfigForm.label.trim(),
      maxMarks: resultConfigForm.maxMarks,
    };

    const newSemesterList = [...semesterList, newComponent];
    const newResultConfig = {
      ...currentConfig,
      [semester]: newSemesterList,
    };

    onUpdateSettings("resultConfig", newResultConfig);
    setResultConfigForm({
      ...resultConfigForm,
      label: "",
      maxMarks: 50,
    });
    
    // Auto-focus back on Component Label
    setTimeout(() => {
      labelInputRef.current?.focus();
    }, 50);
  };

  const handleLocalUpdate = (semester: "1" | "2", id: string, field: "label" | "maxMarks", val: string | number) => {
    setLocalResultConfig(prev => {
      const semList = prev[semester] || [];
      const updated = semList.map(item => {
        if (item.id === id) {
          return {
            ...item,
            [field]: field === "maxMarks" ? (val === "" ? "" : Number(val)) : val
          } as any;
        }
        return item;
      });
      return {
        ...prev,
        [semester]: updated
      };
    });
  };

  const handleSaveItem = (semester: "1" | "2", id: string) => {
    const item = localResultConfig[semester]?.find(x => x.id === id);
    if (!item) return;

    const cleanLabel = item.label.trim();
    if (!cleanLabel) {
      // Revert local state
      if (settings?.resultConfig) {
        setLocalResultConfig(settings.resultConfig);
      }
      setAlert({
        open: true,
        title: "Validation Error",
        description: "Component label cannot be empty.",
        variant: "error"
      });
      return;
    }

    const cleanMax = Math.min(100, Math.max(1, Number(item.maxMarks) || 0));

    const currentConfig = settings?.resultConfig || {};
    const semesterList = currentConfig[semester] || [];
    const duplicate = semesterList.some((x: any) => x.id !== id && x.label.toLowerCase() === cleanLabel.toLowerCase());
    if (duplicate) {
      if (settings?.resultConfig) {
        setLocalResultConfig(settings.resultConfig);
      }
      setAlert({
        open: true,
        title: "Duplicate Component",
        description: `A component with label "${cleanLabel}" already exists for Semester ${semester}.`,
        variant: "error"
      });
      return;
    }

    const updatedSemesterList = semesterList.map((x: any) => {
      if (x.id === id) {
        return {
          ...x,
          label: cleanLabel,
          maxMarks: cleanMax,
        };
      }
      return x;
    });

    const newResultConfig = {
      ...currentConfig,
      [semester]: updatedSemesterList,
    };

    onUpdateSettings("resultConfig", newResultConfig);
  };

  const handleDeleteResultConfig = (semester: "1" | "2", componentId: string) => {
    const currentConfig = settings?.resultConfig || {};
    const semesterList = currentConfig[semester] || [];
    const compToDelete = semesterList.find((c: any) => c.id === componentId);
    if (!compToDelete) return;

    setConfirmAction({
      open: true,
      title: "Delete Component Config",
      description: `Are you sure you want to delete component "${compToDelete.label}" for Semester ${semester}? This will affect grading inputs for teachers.`,
      variant: "destructive",
      onConfirm: () => {
        const newSemesterList = semesterList.filter((c: any) => c.id !== componentId);
        const newResultConfig = {
          ...currentConfig,
          [semester]: newSemesterList,
        };
        onUpdateSettings("resultConfig", newResultConfig);
        setConfirmAction((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleClearResultConfig = () => {
    setConfirmAction({
      open: true,
      title: "Clear Result Configuration",
      description: "Are you sure you want to clear ALL result configurations? This will revert the system to standard 100-mark inputs.",
      variant: "destructive",
      onConfirm: () => {
        onUpdateSettings("resultConfig", { "1": [], "2": [] });
        setConfirmAction((prev) => ({ ...prev, open: false }));
      },
    });
  };

  // Dialog States
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    onConfirm: () => void;
    title: string;
    description: string;
    variant: "default" | "destructive";
  }>({
    open: false,
    onConfirm: () => {},
    title: "",
    description: "",
    variant: "default",
  });
  const [alert, setAlert] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "success" | "error" | "info";
  }>({ open: false, title: "", description: "", variant: "info" });

  useEffect(() => {
    // Fetch media list on mount
    (async () => {
      try {
        const res = await fetch("/api/media/list");
        if (res.ok) {
          const json = await res.json();
          setMediaList(json || []);
          // Populate select
          const sel = document.getElementById(
            "media-select",
          ) as HTMLSelectElement | null;
          if (sel) {
            sel.innerHTML =
              '<option value="">-- Select uploaded letterhead --</option>';
            (json || []).forEach((it: any) => {
              const opt = document.createElement("option");
              opt.value = it.url;
              opt.text = it.name;
              sel.appendChild(opt);
            });
            if (settings?.letterheadUrl)
              sel.value = String(settings.letterheadUrl);
          }
        }
      } catch (err) {
        // ignore
      }
    })();
  }, []);

  const handlePasswordChange = async () => {
    if (adminPassword !== confirmPassword) {
      setAlert({
        open: true,
        title: "Validation Error",
        description: "Passwords do not match.",
        variant: "error",
      });
      return;
    }
    if (adminPassword.length < 6) {
      setAlert({
        open: true,
        title: "Security Requirement",
        description: "Password must be at least 6 characters long.",
        variant: "error",
      });
      return;
    }
    try {
      await Promise.resolve(onChangeAdminPassword(adminPassword));
      setAdminPassword("");
      setConfirmPassword("");
      setAlert({
        open: true,
        title: "Success",
        description: "Admin password updated successfully.",
        variant: "success",
      });
    } catch (err) {
      setAlert({
        open: true,
        title: "Operation Failed",
        description: "Failed to change admin password. Please try again.",
        variant: "error",
      });
    }
  };


  return (
    <div className="grid gap-8 md:grid-cols-2">
      {/* Subject Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-cyan-600" />
            Curriculum Subjects
          </CardTitle>
          <CardDescription>
            Manage subjects used across the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              id="curriculum-subject-input"
              name="curriculum-subject-input"
              autoComplete="off"
              placeholder="New subject name..."
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
            />
            <Button
              onClick={() => {
                if (newSubject) onAddSubject(newSubject);
                setNewSubject("");
              }}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 pt-2">
            {subjects.map((s) => (
              <div
                key={s}
                className="flex items-center gap-1 bg-slate-100 px-2 py-1 rounded-md text-sm group"
              >
                {s}
                <button
                  className="text-red-500 hover:text-red-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => onDeleteSubject(s)}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      {/* Result Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-indigo-600" />
              Result Configuration
            </CardTitle>
            {((settings?.resultConfig?.["1"] || []).length > 0 || (settings?.resultConfig?.["2"] || []).length > 0) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 gap-2 h-8"
                onClick={handleClearResultConfig}
              >
                <Trash2 className="h-3 w-3" />
                Clear All
              </Button>
            )}
          </div>
          <CardDescription>
            Configure Semester 1 & 2 grading sub-components (Total max marks for each must equal 100).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <Label className="text-xs font-bold text-slate-600">Semester</Label>
                <select
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={resultConfigForm.semester}
                  onChange={(e) => setResultConfigForm({ ...resultConfigForm, semester: e.target.value as "1" | "2" })}
                >
                  <option value="1">Semester 1</option>
                  <option value="2">Semester 2</option>
                </select>
              </div>
              <div className="flex-[2] space-y-1">
                <Label className="text-xs font-bold text-slate-600">Component Label</Label>
                <Input
                  ref={labelInputRef}
                  placeholder="e.g. Test 1, Final Exam"
                  value={resultConfigForm.label}
                  onChange={(e) =>
                    setResultConfigForm({
                      ...resultConfigForm,
                      label: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddResultConfig();
                    }
                  }}
                />
              </div>
              <div className="w-24 space-y-1">
                <Label className="text-xs font-bold text-slate-600">Max Marks</Label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={resultConfigForm.maxMarks}
                  onChange={(e) =>
                    setResultConfigForm({
                      ...resultConfigForm,
                      maxMarks: Math.min(100, Math.max(1, Number(e.target.value) || 0)),
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAddResultConfig();
                    }
                  }}
                />
              </div>
              <div className="pt-5 flex items-end">
                <Button
                  onClick={handleAddResultConfig}
                  disabled={!resultConfigForm.label.trim()}
                  className="h-9"
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-6 pt-2">
            {(["1", "2"] as const).map((sem) => {
              const semConfig = localResultConfig[sem] || [];
              const semTotal = semConfig.reduce((acc: number, curr: any) => acc + (Number(curr.maxMarks) || 0), 0);
              const isInvalid = semTotal !== 100;

              return (
                <div key={sem} className="space-y-3 border-l-4 border-indigo-100 pl-4 py-1">
                  <div className="flex flex-col gap-1.5 mb-1">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                        Semester {sem} Configuration
                      </span>
                      <span className={cn(
                        "text-[10px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider transition-colors duration-300",
                        isInvalid
                          ? semTotal > 100
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      )}>
                        {isInvalid
                          ? semTotal > 100
                            ? `⚠️ Exceeds limit: ${semTotal}/100`
                            : `ℹ️ Incomplete: ${semTotal}/100`
                          : `✅ Validated: 100/100`
                        }
                      </span>
                    </div>
                    {/* Animated Progress Bar */}
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative border border-slate-200/40">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all duration-500 ease-out",
                          isInvalid
                            ? semTotal > 100
                              ? "bg-gradient-to-r from-rose-500 to-red-500"
                              : "bg-gradient-to-r from-amber-500 to-amber-600"
                            : "bg-gradient-to-r from-emerald-500 to-teal-500"
                        )}
                        style={{ width: `${Math.min(100, semTotal)}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    {semConfig.map((comp: any) => (
                      <div
                        key={comp.id}
                        className="flex items-center gap-2 p-2 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl transition-all text-sm group"
                      >
                        <Input
                          className="h-8 flex-1 font-semibold bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                          value={comp.label}
                          onChange={(e) => handleLocalUpdate(sem, comp.id, "label", e.target.value)}
                          onBlur={() => handleSaveItem(sem, comp.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.currentTarget.blur();
                            }
                          }}
                          placeholder="Component Label"
                        />
                        <div className="flex items-center gap-1.5 w-32 shrink-0">
                          <Input
                            type="number"
                            className="h-8 text-center bg-white border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                            value={comp.maxMarks}
                            onChange={(e) => handleLocalUpdate(sem, comp.id, "maxMarks", e.target.value)}
                            onBlur={() => handleSaveItem(sem, comp.id)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.currentTarget.blur();
                              }
                            }}
                            placeholder="Max"
                            min="1"
                            max="100"
                          />
                          <span className="text-xs text-slate-400 font-medium select-none">max</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                          onClick={() => handleDeleteResultConfig(sem, comp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {semConfig.length === 0 && (
                    <div className="text-xs text-slate-400 italic py-2 text-center border border-dashed border-slate-100 rounded-xl bg-slate-50/20">
                      No components configured. Falls back to single 100-mark input.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Student Feature Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-cyan-600" />
            Student Features
          </CardTitle>
          <CardDescription>
            Control what features students can access.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Report Card Download</Label>
              <p className="text-xs text-muted-foreground">
                Allow students to download PDFs
              </p>
            </div>
            <Switch
              checked={settings?.reportCardDownload !== false}
              onCheckedChange={(checked: boolean) =>
                onUpdateSettings("reportCardDownload", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Certificate Download</Label>
              <p className="text-xs text-muted-foreground">
                For students with 90%+ average
              </p>
            </div>
            <Switch
              checked={settings?.certificateDownload !== false}
              onCheckedChange={(checked: boolean) =>
                onUpdateSettings("certificateDownload", checked)
              }
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Library Resource Download</Label>
              <p className="text-xs text-muted-foreground">
                Allow students to download PDFs from library
              </p>
            </div>
            <Switch
              checked={settings?.allowLibraryDownload === true}
              onCheckedChange={(checked: boolean) =>
                onUpdateSettings("allowLibraryDownload", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Report Card Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-slate-600" />
            Report Card Settings
          </CardTitle>
          <CardDescription>
            Configure letterhead and signature names shown on generated report
            cards.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Letterhead URL</Label>
            <Input
              placeholder="https://.../letterhead.png"
              value={settings?.letterheadUrl || ""}
              onChange={(e) =>
                onUpdateSettings("letterheadUrl", e.target.value)
              }
            />
            <div className="flex items-center gap-2">
              <input
                type="file"
                accept="image/*"
                id="letterhead-file-input"
                className="hidden"
                onChange={async (e) => {
                  const f = (e.target as HTMLInputElement).files?.[0];
                  if (!f) return;
                  try {
                    const formData = new FormData();
                    formData.append("file", f);
                    formData.append("fileName", f.name);
                    formData.append("bucket", "letterheads");

                    const res = await fetch("/api/media/upload", {
                      method: "POST",
                      body: formData,
                    });

                    const json = await res.json();
                    if (res.ok && json.url) {
                      onUpdateSettings("letterheadUrl", json.url);
                    } else {
                      setAlert({
                        open: true,
                        title: "Upload Failed",
                        description:
                          json.error ||
                          "The letterhead image could not be uploaded.",
                        variant: "error",
                      });
                    }
                  } catch (err: any) {
                    setAlert({
                      open: true,
                      title: "Upload Error",
                      description:
                        err.message ||
                        "An unexpected error occurred during letterhead upload.",
                      variant: "error",
                    });
                  }
                }}
              />
              <Button
                variant="outline"
                onClick={() =>
                  document.getElementById("letterhead-file-input")?.click()
                }
              >
                Upload File
              </Button>
              {settings?.letterheadUrl && (
                <img
                  src={String(settings.letterheadUrl)}
                  alt="letterhead"
                  className="h-12 w-auto rounded-md border"
                />
              )}
            </div>

            <div className="mt-2">
              <Label>Media Library</Label>
              <div className="flex items-center gap-2 mt-2">
                <select
                  id="media-select"
                  className="rounded-xl border-slate-200 h-10 px-3"
                  defaultValue=""
                  onChange={(e) =>
                    onUpdateSettings("letterheadUrl", e.target.value)
                  }
                >
                  <option value="">-- Select uploaded letterhead --</option>
                  {/* Rendered options populated by effect */}
                </select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    try {
                      const res = await fetch("/api/media/list");
                      const json = await res.json();
                      const sel = document.getElementById(
                        "media-select",
                      ) as HTMLSelectElement | null;
                      if (sel) {
                        // Clear existing
                        sel.innerHTML =
                          '<option value="">-- Select uploaded letterhead --</option>';
                        (json || []).forEach((it: any) => {
                          const opt = document.createElement("option");
                          opt.value = it.url;
                          opt.text = it.name;
                          sel.appendChild(opt);
                        });
                      }
                    } catch (err) {
                      setAlert({
                        open: true,
                        title: "Library Error",
                        description:
                          "Failed to fetch the list of uploaded media.",
                        variant: "error",
                      });
                    }
                  }}
                >
                  Refresh
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Director Name</Label>

              <Input
                value={settings?.principalName || ""}
                onChange={(e) =>
                  onUpdateSettings("principalName", e.target.value)
                }
              />
            </div>
            <div className="space-y-1">
              <Label>Homeroom Signatory</Label>
              <Input
                value={settings?.homeroomName || ""}
                onChange={(e) =>
                  onUpdateSettings("homeroomName", e.target.value)
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Teacher Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" />
            Teacher Controls
          </CardTitle>
          <CardDescription>
            Configure editing permissions for teachers.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Teacher Portal Access</Label>
              <p className="text-xs text-muted-foreground">
                Enable or disable faculty login and portal
              </p>
            </div>
            <Switch
              checked={
                settings?.teacherPortalEnabled !== false &&
                String(settings?.teacherPortalEnabled) !== "false"
              }
              onCheckedChange={(checked: boolean) => {
                onUpdateSettings("teacherPortalEnabled", checked);
                // Broadcast event for Navbar to update immediately
                window.dispatchEvent(
                  new CustomEvent("teacherPortalToggle", { detail: checked }),
                );
              }}
            />
          </div>
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Allow Editing After Submission</Label>
              <p className="text-xs text-muted-foreground">
                Subject teachers can edit 'Pending Admin' marks
              </p>
            </div>
            <Switch
              checked={
                settings?.allowTeacherEditAfterSubmission === true ||
                String(settings?.allowTeacherEditAfterSubmission) === "true"
              }
              onCheckedChange={(checked: boolean) =>
                onUpdateSettings("allowTeacherEditAfterSubmission", checked)
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Admin Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-amber-600" />
            Admin Security
          </CardTitle>
          <CardDescription>
            Update your administrative password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label>New Password</Label>
            <PasswordInput
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label>Confirm Password</Label>
            <PasswordInput
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button className="w-full mt-2" onClick={handlePasswordChange}>
            Change Password
          </Button>
          <div className="pt-2">
            <Link
              href="/auth/admin-gate-reset"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" className="w-full">
                Use Admin Gate Reset
              </Button>
            </Link>
            <p className="text-xs text-muted-foreground mt-1">
              Opens the private master gate for emergency administrative
              override.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* System Controls */}
      <Card className="border-red-100">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <ShieldAlert className="h-5 w-5" />
            System Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col gap-3 p-3 bg-slate-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">
                  Students see "Under Construction" page
                </p>
              </div>
              <Button
                variant={maintenanceMode ? "destructive" : "outline"}
                size="sm"
                onClick={onToggleMaintenance}
              >
                {maintenanceMode ? "Disable" : "Enable"}
              </Button>
            </div>
            <div
              className={`text-center py-1 px-4 rounded-full text-[10px] font-black uppercase tracking-widest ${maintenanceMode ? "bg-red-100 text-red-700 animate-pulse" : "bg-green-100 text-green-700"}`}
            >
              {maintenanceMode
                ? "Maintenance Mode Active"
                : "System Status: Online"}
            </div>
          </div>

          <div className="p-4 border border-red-200 rounded-lg bg-red-50/50">
            <h4 className="flex items-center gap-2 text-red-800 font-bold text-sm mb-2">
              <AlertTriangle className="h-4 w-4" /> Danger Zone
            </h4>
            <p className="text-xs text-red-600 mb-4">
              Resetting the system will permanently delete all students,
              teachers, results, applications, and announcements.
            </p>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                setConfirmAction({
                  open: true,
                  title: "System Reset",
                  description:
                    "CRITICAL: This will permanently delete all students, teachers, results, and other data. This action cannot be undone.",
                  variant: "destructive",
                  onConfirm: () => {
                    onResetSystem();
                    setConfirmAction((prev) => ({ ...prev, open: false }));
                  },
                });
              }}
            >
              <RefreshCw className="mr-2 h-4 w-4" /> Reset Entire System
            </Button>
          </div>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmAction.open}
        onClose={() => setConfirmAction({ ...confirmAction, open: false })}
        onConfirm={confirmAction.onConfirm}
        title={confirmAction.title}
        description={confirmAction.description}
        variant={confirmAction.variant}
      />

      <AlertModal
        open={alert.open}
        onClose={() => setAlert({ ...alert, open: false })}
        title={alert.title}
        description={alert.description}
        variant={alert.variant}
      />
    </div>
  );
}
