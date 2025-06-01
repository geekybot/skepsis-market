import { Html, Head, Main, NextScript } from "next/document";
import { ANALYTICS_CONFIG } from "../constants/appConstants";

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        {ANALYTICS_CONFIG.enabled && ANALYTICS_CONFIG.gtmId && (
          <>
            {/* Google Tag Manager */}
            <script
              dangerouslySetInnerHTML={{
                __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${ANALYTICS_CONFIG.gtmId}');`
              }}
            />
            {/* End Google Tag Manager */}
          </>
        )}
      </Head>
      <body>
        {ANALYTICS_CONFIG.enabled && ANALYTICS_CONFIG.gtmId && (
          <>
            {/* Google Tag Manager (noscript) */}
            <noscript>
              <iframe
                src={`https://www.googletagmanager.com/ns.html?id=${ANALYTICS_CONFIG.gtmId}`}
                height="0"
                width="0"
                style={{ display: "none", visibility: "hidden" }}
              />
            </noscript>
            {/* End Google Tag Manager (noscript) */}
          </>
        )}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
