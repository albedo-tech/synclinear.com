import React from "react";

const AmieLogo = ({ className = "" }: { className?: string }) => {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            viewBox="0 0 62 20"
        >
            <title>Amie Logo</title>
            <path
                d="M 33.421 7.828 C 34.94 7.828 35.743 8.853 35.743 10.794 L 35.743 18.369 C 35.743 18.628 35.951 18.837 36.208 18.837 L 38.276 18.837 C 38.533 18.837 38.741 18.628 38.741 18.369 L 38.741 9.881 C 38.741 8.447 38.313 7.225 37.501 6.353 C 36.685 5.475 35.542 5.012 34.193 5.012 C 32.569 5.012 31.205 5.628 30.02 6.897 L 29.977 6.944 L 29.943 6.891 C 29.159 5.663 27.931 5.012 26.397 5.012 C 24.881 5.012 23.644 5.584 22.717 6.712 L 22.63 6.819 L 22.63 5.741 C 22.63 5.481 22.422 5.272 22.165 5.272 L 20.097 5.272 C 19.84 5.272 19.632 5.481 19.632 5.741 L 19.632 18.366 C 19.632 18.625 19.84 18.834 20.097 18.834 L 22.165 18.834 C 22.422 18.834 22.63 18.625 22.63 18.366 L 22.63 10.869 C 22.63 9.706 23.101 8.997 23.495 8.603 C 23.995 8.108 24.666 7.829 25.367 7.825 C 26.886 7.825 27.689 8.85 27.689 10.791 L 27.689 18.366 C 27.689 18.625 27.897 18.834 28.154 18.834 L 30.222 18.834 C 30.479 18.834 30.687 18.625 30.687 18.366 L 30.687 10.869 C 30.687 9.706 31.158 8.997 31.552 8.603 C 32.048 8.112 32.73 7.828 33.421 7.828 Z M 61.954 11.703 C 61.954 9.825 61.411 8.141 60.428 6.959 C 59.368 5.684 57.831 5.012 55.986 5.012 C 54.191 5.012 52.557 5.734 51.383 7.047 C 50.22 8.344 49.581 10.128 49.581 12.069 C 49.581 16.222 52.269 19.125 56.116 19.125 C 58.575 19.125 60.602 17.912 61.644 15.856 C 61.774 15.597 61.662 15.303 61.392 15.2 L 59.728 14.566 C 59.498 14.478 59.244 14.587 59.142 14.812 C 58.624 15.925 57.527 16.572 56.119 16.572 C 54.092 16.572 52.688 15.109 52.455 12.753 L 52.449 12.697 L 61.492 12.697 C 61.749 12.697 61.957 12.487 61.957 12.228 L 61.957 11.703 Z M 52.592 10.453 L 52.607 10.391 C 53.063 8.581 54.284 7.541 55.961 7.541 C 57.734 7.541 58.9 8.663 58.928 10.4 L 58.928 10.45 L 52.592 10.45 Z M 17.245 18.203 L 10.611 0.553 C 10.543 0.372 10.37 0.25 10.177 0.25 L 7.146 0.25 C 6.953 0.25 6.78 0.372 6.712 0.553 L 0.078 18.203 C -0.037 18.509 0.186 18.837 0.512 18.837 L 2.688 18.837 C 2.883 18.837 3.057 18.716 3.125 18.531 L 4.312 15.322 L 12.939 15.322 L 14.145 18.534 C 14.214 18.716 14.387 18.837 14.579 18.837 L 16.808 18.837 C 16.961 18.838 17.105 18.763 17.192 18.636 C 17.28 18.509 17.299 18.347 17.245 18.203 Z M 5.354 12.509 L 8.596 3.753 L 11.885 12.509 Z M 40.827 5.744 L 40.827 7.612 C 40.827 7.872 41.035 8.081 41.292 8.081 L 43.586 8.081 L 43.586 18.369 C 43.586 18.628 43.794 18.838 44.051 18.838 L 46.119 18.838 C 46.376 18.838 46.584 18.628 46.584 18.369 L 46.584 5.744 C 46.584 5.484 46.376 5.275 46.119 5.275 L 41.289 5.275 C 41.035 5.275 40.827 5.484 40.827 5.744 Z M 43.536 0.719 L 43.536 2.881 C 43.536 3.141 43.744 3.35 44.001 3.35 L 46.175 3.35 C 46.432 3.35 46.64 3.141 46.64 2.881 L 46.64 0.719 C 46.64 0.459 46.432 0.25 46.175 0.25 L 44.001 0.25 C 43.744 0.25 43.536 0.462 43.536 0.719 Z"
                fill="currentColor"
            />
        </svg>
    );
};

export default AmieLogo;

