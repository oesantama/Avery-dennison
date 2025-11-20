import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConsultasRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/consultas/entregas');
  }, [router]);
  return null;
}
