import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { TaskPriority, TaskStatus } from '../types';
import { CheckSquare, Plus, X, Clock, PlayCircle, CheckCircle2 } from 'lucide-react';

const STATUS_LABEL: Record<TaskStatus, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  completada: 'Completada'
};

const STATUS_STYLE: Record<TaskStatus, string> = {
  pendiente: 'bg-[#fffbeb] text-[#b45309] border border-[#fef3c7]',
  en_progreso: 'bg-[#dce1ff] text-[#0041c8] border border-[#dce1ff]',
  completada: 'bg-[#6cf8bb]/40 text-[#00714d] border border-[#6cf8bb]/50'
};

const PRIORITY_STYLE: Record<TaskPriority, string> = {
  baja: 'text-[#737688]',
  media: 'text-[#0041c8]',
  alta: 'text-[#a20030]'
};

export const TasksScreen: React.FC = () => {
  const { role, currentEmployee, employees, tasks, addTask, updateTaskStatus, showToast } = useApp();

  const [newTaskModal, setNewTaskModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [assignedEmployeeId, setAssignedEmployeeId] = useState<string>('');
  const [dueDate, setDueDate] = useState('');

  const visibleTasks = role === 'owner'
    ? tasks
    : tasks.filter((t) => t.assignedEmployeeId === currentEmployee?.id);

  const employeeName = (employeeId?: string) => employees.find((e) => e.id === employeeId)?.name || 'Sin asignar';

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      showToast('Ponle un título a la tarea');
      return;
    }
    addTask({
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assignedEmployeeId: assignedEmployeeId || undefined,
      dueDate: dueDate || undefined
    });
    setNewTaskModal(false);
    setTitle('');
    setDescription('');
    setPriority('media');
    setAssignedEmployeeId('');
    setDueDate('');
  };

  const nextStatus: Record<TaskStatus, TaskStatus | null> = {
    pendiente: 'en_progreso',
    en_progreso: 'completada',
    completada: null
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-[#131b2e] tracking-tight">Tareas</h1>
          <p className="text-xs md:text-sm text-[#434656] mt-0.5">
            {role === 'owner' ? 'Crea y asigna tareas a tu equipo' : 'Tus tareas asignadas'}
          </p>
        </div>

        {role === 'owner' && (
          <button
            onClick={() => setNewTaskModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#0041c8] text-white rounded-xl text-xs font-display font-bold shadow-md hover:bg-[#0036a8] transition-all active:scale-95 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Tarea</span>
          </button>
        )}
      </div>

      {visibleTasks.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#eaedff] p-10 text-center space-y-2">
          <CheckSquare className="w-8 h-8 text-[#c3c5d9] mx-auto" />
          <h3 className="font-display font-bold text-sm text-[#131b2e]">No hay tareas todavía</h3>
          <p className="text-xs text-[#737688]">
            {role === 'owner' ? 'Crea la primera tarea para tu equipo.' : 'Cuando te asignen una tarea, aparecerá aquí.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {visibleTasks.map((task) => {
            const next = nextStatus[task.status];
            return (
              <div key={task.id} className="bg-white rounded-2xl border border-[#eaedff] p-4 shadow-[0_2px_10px_rgba(19,27,46,0.03)] space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-display font-bold text-sm text-[#131b2e]">{task.title}</h3>
                    {task.description && <p className="text-xs text-[#737688] mt-0.5">{task.description}</p>}
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold shrink-0 ${STATUS_STYLE[task.status]}`}>
                    {STATUS_LABEL[task.status]}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#737688]">
                  <span className={`font-semibold ${PRIORITY_STYLE[task.priority]}`}>Prioridad {task.priority}</span>
                  {role === 'owner' && <span>{employeeName(task.assignedEmployeeId)}</span>}
                  {task.dueDate && <span>Vence: {task.dueDate}</span>}
                </div>

                {next && (
                  <button
                    onClick={() => updateTaskStatus(task.id, next)}
                    className="w-full py-2 px-3 bg-[#f2f3ff] hover:bg-[#eaedff] text-[#0041c8] rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    {next === 'en_progreso' ? <PlayCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>Marcar como {STATUS_LABEL[next].toLowerCase()}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {newTaskModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#131b2e]/60 backdrop-blur-xs"
          onClick={() => setNewTaskModal(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl p-6 border border-[#eaedff] shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#eaedff] pb-3">
              <h3 className="font-display font-bold text-lg text-[#131b2e]">Nueva Tarea</h3>
              <button onClick={() => setNewTaskModal(false)} className="p-1 rounded-full hover:bg-[#f2f3ff]">
                <X className="w-5 h-5 text-[#737688]" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej. Hacer el cierre de caja"
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Descripción (opcional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Asignar a</label>
                  <select
                    value={assignedEmployeeId}
                    onChange={(e) => setAssignedEmployeeId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8]"
                  >
                    <option value="">Sin asignar</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#434656] block mb-1">Prioridad</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-sm font-semibold outline-none border border-transparent focus:border-[#0041c8]"
                  >
                    <option value="baja">Baja</option>
                    <option value="media">Media</option>
                    <option value="alta">Alta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#434656] block mb-1">Fecha límite (opcional)</label>
                <input
                  type="text"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  placeholder="Ej. 20 de septiembre"
                  className="w-full px-3 py-2 bg-[#f2f3ff] rounded-xl text-sm font-medium outline-none border border-transparent focus:border-[#0041c8] focus:bg-white"
                />
              </div>

              <div className="pt-3 border-t border-[#eaedff] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setNewTaskModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#434656] hover:bg-[#f2f3ff] rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0041c8] hover:bg-[#0036a8] text-white rounded-xl text-xs font-display font-bold shadow-md"
                >
                  Crear Tarea
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
