import { useRouter } from 'vue-router';

/**
 * Composable for stub page common functionality
 */
export function useStubPage() {
  const router = useRouter();

  const goBack = () => {
    router.go(-1);
  };

  return {
    goBack,
  };
}
