
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