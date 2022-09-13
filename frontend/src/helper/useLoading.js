import { useState } from "react";

// Centralizes modal control
const useLoading = () => {
  const [isLoading, setisLoading] = useState(false);

  const loadingFinished = () => setisLoading(false);
  const loading = () => setisLoading(true);

  return { isLoading, loadingFinished, loading };
};

export default useLoading;
