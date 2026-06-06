interface LoadingProps {
  message?: string;
  fullScreen?: boolean;
}

export default function Loading({ message = "Loading...", fullScreen = false }: LoadingProps) {
  return (
    <div className={`loading-screen ${fullScreen ? "loading-screen-full" : ""}`}>
      <div className="loading-spinner" />
      {message && <span className="loading-text">{message}</span>}
    </div>
  );
}
