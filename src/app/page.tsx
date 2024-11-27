"use client";
import ReactMarkdown from "react-markdown";
import { useEffect, useState } from "react";

export default function Home() {
  const [apiUrl, setApiUrl] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setApiUrl(`${window.location.origin}/api/admin`);
    }
  }, []);

  return (
    <div
      style={{
        padding: "3rem",
        display: "flex",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <ReactMarkdown>{`# CSV instructions`}</ReactMarkdown>
      <ReactMarkdown>{`
    To generate and download CSV go to ${apiUrl} in your browser
    Note: This may take a few seconds
---------`}</ReactMarkdown>
<ReactMarkdown>{`

---------`}</ReactMarkdown>
      <ReactMarkdown>{`# API DOCS`}</ReactMarkdown>
      <ReactMarkdown>{`## POST:
    ${apiUrl}
---------`}</ReactMarkdown>
      <ReactMarkdown>{`## Headers:

    Authorization: Bearer AQ Api auth token

---------`}</ReactMarkdown>
      <ReactMarkdown>{`## GET manufacturerIds: 
    (see AQ docs)
    https://developer.aq-fes.com/api-details#api=aq-products-api&operation=ProductsAPI_GetProducts
  
---------`}</ReactMarkdown>
      <ReactMarkdown>{`## Request Body:

    // Example with Atosa and Cleveland
    
    {
      "manufacturerIds": [
        "9bcbe7a0-be0d-dd11-a23a-00304834a8c",
        "d0865b70-42ae-4fae-90dd-59fef12526e"
        ]
    }

---------`}</ReactMarkdown>
      <ReactMarkdown>{`## Return types:
    - Type: string
    - Published: string (1 or 0)
    - Visibility in catalog: string
    - In stock?: string (1 or 0)
    - SKU: string
    - Name: string
    - Short description: string
    - Description: string (HTML)
    - Weight (lbs): number
    - Length (in): number
    - Width (in): number
    - Height (in): number
    - Regular price: string
    - Categories: string
    - Tags: string[]
    - Shipping class: string
    - Images: [{name: string, url: string (URL)}]
    - Grouped products: SKU[]
    - Cross-sells: SKU[]
    - meta:documents: [{name: string, url: string (URL)}]
    - meta:brand: string
    - meta:certifications: string[]
    - Attributes: [{name: string, value: string, visible: string, global: string}]
---------
    `}</ReactMarkdown>
      <ReactMarkdown>{`## Sample return:
      (Not actual product data)

    [
      {
        "Type": "simple",
        "Published": "1",
        "Visibility": "visible",
        "In stock?": "1",
        "SKU": "36DMK1010 - 8c290e92-9f14-e011-a08d-001018721196",
        "Name": " 36DMK1010",
        "Short description": "Kettle on Modular Base, direct steam, 36\", (2) 10 gallon 2/3 steam jacketed kettles with lift-of covers, manual tilt, steam control kit includes: needle type steam control valves, steam trap, condensate strainer, check valve, nipple & fittings (factory assembled & mounted on kettle), double pantry faucet, 50 psi rating, stainless steel construction with 316 series stainless steel liner, adjustable flanged feet",
        "Description": "<li>Kettle on Modular Base</li><li>direct steam</li><li>36\"</li><li>(2) 10 gallon 2/3 steam jacketed kettles with lift-of covers</li><li>manual tilt</li><li>steam control kit includes: needle type steam control valves</li><li>steam trap</li><li>condensate strainer</li><li>check valve</li><li>nipple & fittings (factory assembled & mounted on kettle)</li><li>double pantry faucet</li><li>50 psi rating</li><li>stainless steel construction with 316 series stainless steel liner</li><li>adjustable flanged feet</li>",
        "Weight (lbs)": 10,
        "Length (in)": 33.5,
        "Width (in)": 36,
        "Height (in)": 54.5,
        "Regular price": "29482.43",
        "Categories": "Cooking Equipment > Kettles",
        "Tags": [
            "Water Filtration System",
            "Cartridge"
        ],
        "Shipping class": "85",
        "Images": [
            {
                "name": "picture",
                "url": "https://api.aq-fes.com/products-api/resources/pictures/64e3d4a3-ef49-4ecb-9d7d-ed5b830ab894/picture.jpg?subscription-key=3408be88900145c1a97f0b2707c3119b",
                "mimeType": "",
                "mediaType": "picture",
                "id": "64e3d4a3-ef49-4ecb-9d7d-ed5b830ab894"
            },
            {
                "name": "group picture",
                "url": "https://api.aq-fes.com/products-api/resources/pictures/6983842b-db47-4611-a9a8-60d5563fef46/group-picture.jpg?subscription-key=3408be88900145c1a97f0b2707c3119b",
                "mimeType": "",
                "mediaType": "picture",
                "id": "6983842b-db47-4611-a9a8-60d5563fef46"
            }
        ],
        "Grouped products": [
            "ES2446 - 41395e00-e014-df11-b3a6-001ec95274b6",
            "INSTKITCET3 - 4c675aaa-4eda-45c4-90b0-0e9826f333b9",
            "11000115897 - 3705f4fe-7015-4b28-93eb-3050510b6993",
            "INSKITCET3 - 9e20be19-fe86-4ae2-b92d-3b2bbf557fd8",
            "11000115896 - c8dfac59-907c-4a79-85d1-4aa6917199dc"
        ],
        "Cross-sells": [
            "INSTKITCET3 - 4c675aaa-4eda-45c4-90b0-0e9826f333b9",
            "INSKITCET3 - 9e20be19-fe86-4ae2-b92d-3b2bbf557fd8",
            "11000115896 - c8dfac59-907c-4a79-85d1-4aa6917199dc"
        ],
        "meta:documents": [
            {
                "name": "cutsheet",
                "url": "https://api.aq-fes.com/products-api/resources/documents/0a0b1781-a6f2-4912-8979-fb90376f2eae?subscription-key=3408be88900145c1a97f0b2707c3119b",
                "mimeType": "",
                "mediaType": "cutsheet",
                "id": "0a0b1781-a6f2-4912-8979-fb90376f2eae"
            },
            {
                "name": "warranty sheet",
                "url": "https://api.aq-fes.com/products-api/resources/documents/a4fe6041-b005-4320-8b18-c578d1a28681?subscription-key=3408be88900145c1a97f0b2707c3119b",
                "mimeType": "",
                "mediaType": "warrantysheet",
                "id": "a4fe6041-b005-4320-8b18-c578d1a28681"
            }
        ],
        "meta:brand": "SteamChef",
        "meta:certifications": [
            "NSF",
            "UL",
            "ENERGY STAR"
        ],
        "Attributes": [
            {
                "name": "Filter kind",
                "value": "scale inhibitor",
                "visible": "1",
                "global": "1"
            },
            {
                "name": "Service Flow Rate",
                "value": "1 - 1.49 GPM",
                "visible": "1",
                "global": "1"
            }
        ]
      },
  ]

---------`}</ReactMarkdown>
    </div>
  );
}
