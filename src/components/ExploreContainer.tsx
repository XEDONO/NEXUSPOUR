import './ExploreContainer.css';

interface ContainerProps { }

const ExploreContainer: React.FC<ContainerProps> = () => {
  return (
    <div id="container" className="card animate-entrance">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[rgba(98,192,106,0.12)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2C12 2 7 6 7 10C7 13.866 9.68629 17 12 17C14.3137 17 17 13.866 17 10C17 6 12 2 12 2Z" stroke="#45A852" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <strong className="block text-lg">Ready to manage your cafe?</strong>
          <p className="muted">Start by checking temperature logs and daily checks.</p>
        </div>
      </div>
    </div>
  );
};

export default ExploreContainer;
