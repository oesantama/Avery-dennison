"use client";
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ConsultasRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/consultas/entregas');
  }, [router]);
  return null;
}
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ConsultasRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/consultas/entregas');
  }, [router]);
  return null;
}
