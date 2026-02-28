'use client';

import { useEffect, useState, useCallback } from 'react';
import { IntakeFormData } from '@/types/intake';
import { ComplianceRoadmap } from '@/types/roadmap';
import { generateRoadmap } from '@/lib/compliance-engine';

interface UseRoadmapReturn {
  intakeData: IntakeFormData | null;
  roadmap: ComplianceRoadmap | null;
  loading: boolean;
  completedTasks: Set<string>;
  toggleTask: (id: string) => void;
}

export function useRoadmap(): UseRoadmapReturn {
  const [intakeData, setIntakeData] = useState<IntakeFormData | null>(null);
  const [roadmap, setRoadmap] = useState<ComplianceRoadmap | null>(null);
  const [loading, setLoading] = useState(true);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem('soc2-intake-data');
    if (stored) {
      const data: IntakeFormData = JSON.parse(stored);
      setIntakeData(data);
      setRoadmap(generateRoadmap(data));
    }
    const done = localStorage.getItem('soc2-completed-tasks');
    if (done) {
      setCompletedTasks(new Set(JSON.parse(done)));
    }
    setLoading(false);
  }, []);

  const toggleTask = useCallback((id: string) => {
    setCompletedTasks(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      localStorage.setItem('soc2-completed-tasks', JSON.stringify([...next]));
      return next;
    });
  }, []);

  return { intakeData, roadmap, loading, completedTasks, toggleTask };
}
