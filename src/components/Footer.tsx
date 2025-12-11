import { config } from '../config';

export const Footer = () => {
  return (
    <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 py-1.5 transition-colors duration-200">
      <div className="max-w-screen-2xl mx-auto px-2 sm:px-4">
        <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-3 text-gray-400 dark:text-gray-500 text-xs">
          <span className="hidden sm:inline">©</span>
          <span className="sm:hidden">©</span>
          <span>{new Date().getFullYear()}</span>
          <span className="hidden xs:inline">JSON 格式化工具</span>
          <span className="text-green-600 dark:text-green-400">v{config.version}</span>
          {(config.icp || config.policeRegistration) && (
            <>
              {config.icp && (
                <a
                  href={config.icp.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  {config.icp.number}
                </a>
              )}
              {config.policeRegistration && (
                <a
                  href={config.policeRegistration.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-green-600 dark:hover:text-green-400 transition-colors"
                >
                  {config.policeRegistration.number}
                </a>
              )}
            </>
          )}
        </div>
      </div>
    </footer>
  );
};
