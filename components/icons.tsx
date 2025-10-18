

import React from 'react';

export const DotsIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
  </svg>
);

export const AnchorIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    {title && <title>{title}</title>}
    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
    <path d="M12 9v12m-8 -8a8 8 0 0 0 16 0m1 0h-2m-14 0h-2" />
    <path d="M12 6m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" />
  </svg>
);

export const RookieIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.62a8.983 8.983 0 013.362-3.867 8.262 8.262 0 013 2.457z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a8.25 8.25 0 006.962-12.952 8.262 8.262 0 00-3-2.457A8.983 8.983 0 0012 9.62a8.287 8.287 0 00-2.962-2.572" />
  </svg>
);

export const WaiversIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
    </svg>
);

// FIX: Add title prop and render a <title> element for accessibility, resolving the type error in PlayerCard.tsx.
export const FeatherIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        {title && <title>{title}</title>}
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.24 12.24a6 6 0 00-8.49-8.49L5 10.5V19h8.5z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 8L2 22" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.5 15H9" />
    </svg>
);

export const SaveIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />
  </svg>
);

export const HistoryIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export const UploadIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
  </svg>
);

export const UploadRomIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v8m-3-5l3-3 3 3M5 18h14" />
  </svg>
);

export const InfoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

export const SegaGenesisLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 175.747 41.940002" {...props}>
      <g transform="translate(-208.50401,-398.761)">
        <polygon
          points="371.794,440.701 384.251,433.486 384.251,418.225 372.314,411.322 323.523,411.322 314.751,398.761 277.225,398.761 268.401,411.322 220.39,411.322 220.39,411.322 208.504,418.173 208.504,433.486 221.013,440.701 "
          fillRule="evenodd"
        />
        <polygon
          points="211.099,432.55 221.583,438.623 371.171,438.623 381.656,432.55 381.656,419.16 371.744,413.398 322.486,413.398 313.611,400.837 278.263,400.837 278.263,400.837 269.491,413.398 220.961,413.398 211.099,419.108 "
          fill="#ffffff"
          fillRule="evenodd"
        />
        <path
          d="m 289.429,410.349 c 0,0.658 0.536,1.179 1.179,1.172 h 4.815 v -1.466 h -4.522 v -0.411 h 3.563 v -1.459 h -5.028 l -0.007,2.164 0,0 z"
          fillRule="evenodd"
        />
        <path
          d="m 289.436,405.515 c 0,-0.606 0.522,-1.169 1.172,-1.166 h 4.815 v 1.459 h -4.522 v 0.411 h 3.563 v 1.479 h -5.035 l 0.007,-2.183 0,0 z"
          fillRule="evenodd"
        />
        <polygon
          points="321.603,424.298 336.863,424.298 336.863,430.371 331.414,434.056 314.57,434.056 320.15,430.318 330.011,430.318 330.011,428.035 314.751,428.035 314.751,422.091 320.384,418.277 320.384,418.277 337.201,418.277 331.646,422.013 321.603,422.013 "
          fillRule="evenodd"
        />
        <polygon
          points="338.992,418.277 338.992,418.277 345.843,418.277 345.843,434.056 338.992,434.056 "
          fillRule="evenodd"
        />
        <polygon
          points="355.341,424.298 370.601,424.298 370.601,430.371 365.15,434.056 348.308,434.056 353.888,430.318 363.75,430.318 363.75,428.035 348.49,428.035 348.49,422.091 354.121,418.277 354.121,418.277 370.939,418.277 365.384,422.013 355.341,422.013 "
          fillRule="evenodd"
        />
        <polygon
          points="299.908,430.318 299.908,428.035 306.472,428.035 312.052,424.298 299.908,424.298 299.908,422.013 309.794,422.013 315.349,418.277 299.025,418.277 293.056,421.937 293.056,421.937 293.056,434.056 309.666,434.056 315.271,430.318 "
          fillRule="evenodd"
        />
        <polygon
          points="251.948,430.318 251.948,428.035 258.514,428.035 264.093,424.298 251.948,424.298 251.948,422.013 261.835,422.013 267.389,418.277 251.065,418.277 245.097,421.937 245.097,421.937 245.097,434.056 261.706,434.056 267.312,430.318 "
          fillRule="evenodd"
        />
        <polygon
          points="284.284,428.814 275.772,423.519 275.772,434.056 268.92,434.056 268.92,418.277 275.875,418.277 284.284,422.896 284.284,418.277 284.284,418.277 291.136,418.277 291.136,434.056 284.284,434.056 "
          fillRule="evenodd"
        />
        <polygon
          points="227.968,422.013 227.968,430.318 236.48,430.318 236.48,428.035 229.525,428.035 235.079,424.298 243.332,424.298 243.332,430.527 238.089,434.056 221.117,434.056 221.117,422.119 221.117,422.119 226.8,418.277 245.382,418.277 239.854,422.013 "
          fillRule="evenodd"
        />
        <path
          d="m 290.436,402.382 c -1.634,0 -2.96,1.325 -2.96,2.959 v 5.18 c 0,1.634 1.326,2.959 2.96,2.959 h 4.988 v -1.459 h -4.864 c -0.858,0 -1.619,-0.813 -1.619,-1.671 v -4.84 c 0,-0.858 0.761,-1.651 1.619,-1.651 h 4.864 v -1.479 h -4.988 l 0,0.002 z"
          fillRule="evenodd"
        />
        <path
          d="m 299.88,410.095 v -4.287 h 4.756 v -1.459 h -5.023 c -0.65,-0.003 -1.172,0.56 -1.172,1.166 l -0.006,4.834 c 0,0.658 0.535,1.179 1.178,1.172 h 3.064 l -0.008,-3.362 h -2.305 v 1.446 h 0.852 v 0.489 h -1.336 l 0,0.001 z"
          fillRule="evenodd"
        />
        <path
          d="m 286.066,402.368 h -4.779 c -2.013,0 -3.646,1.632 -3.646,3.645 0,2.014 1.633,3.607 3.646,3.59 h 1.456 v 0.492 h -5.07 l 0,1.427 h 4.905 c 0.922,0 1.67,-0.748 1.67,-1.669 0,-0.922 -0.748,-1.657 -1.67,-1.657 l -1.271,-0.005 c -1.196,0 -2.166,-0.97 -2.166,-2.166 0,-1.196 0.969,-2.166 2.166,-2.166 h 4.762 l -0.003,-1.491 0,0 z"
          fillRule="evenodd"
        />
        <path
          d="m 286.066,405.769 h -4.967 v 0.489 l 1.49,0.003 c 2.014,0 3.646,1.593 3.646,3.606 0,2.014 -1.632,3.611 -3.646,3.611 l -4.916,-0.01 0,-1.451 h 4.905 c 1.196,0 2.166,-0.969 2.166,-2.165 0,-1.196 -0.97,-2.153 -2.166,-2.153 l -1.271,-0.005 c -0.922,0 -1.67,-0.748 -1.67,-1.67 0,-0.922 0.748,-1.67 1.67,-1.67 h 4.762 l -0.003,1.415 0,0 z"
          fillRule="evenodd"
        />
        <path
          d="m 310.193,404.099 c -0.059,-0.139 -0.08,-0.172 -0.24,-0.172 -0.16,0 -0.199,0.083 -0.26,0.222 l -3.029,9.331 1.594,0.002 1.713,-5.173 0.564,1.747 h -1.131 v 1.472 h 3.219 l -2.43,-7.429 0,0 z"
          fillRule="evenodd"
        />
        <path
          d="m 299.441,413.481 c -1.634,0 -2.96,-1.325 -2.96,-2.959 v -5.18 c 0,-1.634 1.326,-2.959 2.96,-2.959 h 5.195 v 1.479 h -5.07 c -0.859,0 -1.62,0.793 -1.62,1.651 v 4.84 c 0,0.858 0.76,1.671 1.62,1.671 h 3.592 v -4.351 h -2.793 v -1.453 h 4.277 v 6.92 l 3.047,-9.428 c 0.328,-0.934 1.217,-1.604 2.264,-1.604 1.068,0 1.975,0.699 2.283,1.666 l 3.164,9.708 h -5.996 v -1.459 h 3.895 l -2.641,-8.097 c -0.154,-0.445 -0.43,-0.498 -0.705,-0.498 -0.287,0 -0.553,0.118 -0.703,0.525 l -3.1,9.529 h -6.709 l 0,-0.001 z"
          fillRule="evenodd"
        />
      </g>
    </svg>
);


export const EASportsLogo: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192.756 192.756" {...props}>
        <path fillRule="evenodd" clipRule="evenodd" fill="#cc2229" d="M124.482 36.658l-38.671 61.08H43.863l9.503-15.106h26.218l9.503-15.107H30.754L21.25 82.632h14.092l-19.008 30.212h78.325l29.823-47.617 10.815 17.405h-9.504l-9.504 15.106h28.512l9.504 15.106h18.023l-47.846-76.186z" />
        <path fillRule="evenodd" clipRule="evenodd" fill="#cc2229" d="M111.701 37.314H49.762L40.258 52.42h61.939l9.504-15.106z" />
        <path d="M33.048 125.65v4.27h4.259v-1.971c0-5.254-1.965-6.566-7.208-6.566h-8.521c-5.244 0-6.882 1.641-6.882 7.225v2.627c0 5.582 1.638 6.895 6.882 6.895h11.471v8.867H19.284v-4.598h-4.588v1.971c0 5.254 1.638 6.896 6.882 6.896h9.176c5.244 0 6.882-1.643 6.882-6.896v-3.613c0-5.252-1.638-6.895-6.882-6.895h-11.47v-8.211h13.764v-.001zM140.211 125.65h10.16v-4.267h-24.906v4.267h9.832v25.616h4.914V125.65zM171.672 125.65v4.27h4.262v-1.971c0-5.254-1.967-6.566-6.883-6.566h-8.52c-5.572 0-6.883 1.641-6.883 7.225v2.627c0 5.582 1.311 6.895 6.883 6.895H172v8.867h-15.074v-4.598h-4.588v1.971c0 5.254 1.639 6.896 6.883 6.896h10.158c5.57 0 6.881-1.643 6.881-6.896v-3.613c0-5.252-1.311-6.895-6.881-6.895h-11.471v-8.211h13.764v-.001z" fillRule="evenodd" clipRule="evenodd" fill="#295ba7" stroke="#295ba7" strokeWidth="1.368" strokeMiterlimit="2.613" />
        <path d="M41.897 151.266h4.915v-11.494H58.61c4.26 0 6.226-1.643 6.226-5.91v-6.568c0-4.27-1.966-5.91-6.226-5.91H41.897v29.882zm14.747-25.944c2.294 0 3.277.658 3.277 2.957v4.268c0 2.627-.983 3.285-3.277 3.285h-9.832v-10.51h9.832z" fillRule="evenodd" clipRule="evenodd" fill="#295ba7" />
        <path d="M41.897 151.266h4.915v-11.494H58.61c4.26 0 6.226-1.643 6.226-5.91v-6.568c0-4.27-1.966-5.91-6.226-5.91H41.897v29.882zm14.747-25.944c2.294 0 3.277.658 3.277 2.957v4.268c0 2.627-.983 3.285-3.277 3.285h-9.832v-10.51h9.832z" fill="none" stroke="#295ba7" strokeWidth="1.368" strokeMiterlimit="2.613" />
        <path d="M68.77 128.607v15.762c0 5.254 1.639 6.896 6.882 6.896h12.125c5.244 0 6.882-1.643 6.882-6.896v-15.762c0-5.584-1.638-7.225-6.882-7.225H75.651c-5.243.001-6.881 1.641-6.881 7.225zm4.915 18.389v-21.674h16.059v21.674H73.685z" fillRule="evenodd" clipRule="evenodd" fill="#295ba7" />
        <path d="M68.77 128.607v15.762c0 5.254 1.639 6.896 6.882 6.896h12.125c5.244 0 6.882-1.643 6.882-6.896v-15.762c0-5.584-1.638-7.225-6.882-7.225H75.651c-5.243.001-6.881 1.641-6.881 7.225zm4.915 18.389v-21.674h16.059v21.674H73.685z" fill="none" stroke="#295ba7" strokeWidth="1.368" strokeMiterlimit="2.613" />
        <path d="M99.248 151.266h5.242v-11.494h1.311l12.127 11.494h7.537l-13.764-11.494h4.588c4.26 0 6.227-1.643 6.227-5.91v-6.568c0-4.27-1.967-5.91-6.227-5.91H99.248v29.882zm15.074-25.944c1.967 0 2.949.658 2.949 2.957v4.596c0 2.299-.982 2.957-2.949 2.957h-9.832v-10.51h9.832z" fillRule="evenodd" clipRule="evenodd" fill="#295ba7" />
        <path d="M99.248 151.266h5.242v-11.494h1.311l12.127 11.494h7.537l-13.764-11.494h4.588c4.26 0 6.227-1.643 6.227-5.91v-6.568c0-4.27-1.967-5.91-6.227-5.91H99.248v29.882zm15.074-25.944c1.967 0 2.949.658 2.949 2.957v4.596c0 2.299-.982 2.957-2.949 2.957h-9.832v-10.51h9.832z" fill="none" stroke="#295ba7" strokeWidth="1.368" strokeMiterlimit="2.613" />
        <path fillRule="evenodd" clipRule="evenodd" fill="#295ba7" d="M180.85 126.965h-1.313v-4.926h-1.31v-1.314h3.933v1.314h-1.31v4.926zM187.402 123.354l-1.31 3.939h-.654l-1.311-3.939-.656 3.611h-1.311l.983-6.24h.984l1.637 3.941 1.638-3.941h.985l.982 6.24h-1.31l-.657-3.611z" />
    </svg>
);

export const ResetIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
    </svg>
);

export const Bars3Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
    </svg>
);

export const Squares2x2Icon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
);

export const PencilIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
    </svg>
);

export const ChevronUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

export const ChevronDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

export const ChevronUpDownIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
  </svg>
);


export const ChartBarIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
);

export const UserGroupIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m-7.5-2.962a3.752 3.752 0 01-4.498 0 3.752 3.752 0 01-4.498 0M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

export const ArrowDownTrayIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

export const QuestionMarkCircleIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
);

export const Cog6ToothIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.438.995a6.75 6.75 0 010 1.905s.145.755.438.995l1.003.827c.424.35.534.954.26 1.431l-1.296 2.247a1.125 1.125 0 01-1.37.49l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.37-.49l-1.296-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.437-.995a6.75 6.75 0 010-1.905s-.145-.755-.437-.995l-1.004-.827a1.125 1.125 0 01-.26-1.431l1.296-2.247a1.125 1.125 0 011.37-.49l1.217.456c.355.133.75.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.213-1.28z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

export const PowerIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
    </svg>
);

export const HospitalIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = ({ title, ...props }) => (
    <svg xmlns="http://www.w3.org/2000/svg" stroke="currentColor" width="24px" height="24px" fill="none" viewBox="0 0 24 24" stroke-width="1.5" {...props}>
        {title && <title>{title}</title>}
        <path d="M13.9 18H10.1C9.76863 18 9.5 17.7314 9.5 17.4V15.1C9.5 14.7686 9.23137 14.5 8.9 14.5H6.6C6.26863 14.5 6 14.2314 6 13.9V10.1C6 9.76863 6.26863 9.5 6.6 9.5H8.9C9.23137 9.5 9.5 9.23137 9.5 8.9V6.6C9.5 6.26863 9.76863 6 10.1 6H13.9C14.2314 6 14.5 6.26863 14.5 6.6V8.9C14.5 9.23137 14.7686 9.5 15.1 9.5H17.4C17.7314 9.5 18 9.76863 18 10.1V13.9C18 14.2314 17.7314 14.5 17.4 14.5H15.1C14.7686 14.5 14.5 14.7686 14.5 15.1V17.4C14.5 17.7314 14.2314 18 13.9 18Z" stroke="currentColor" stroke-width="1.5">
        </path>
        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="#FF0000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        </path>
    </svg>
);