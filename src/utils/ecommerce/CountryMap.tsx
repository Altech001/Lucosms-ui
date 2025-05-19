// react plugin for creating vector maps
import { VectorMap } from "@react-jvectormap/core";
import { worldMill } from "@react-jvectormap/world";

// Define the allowed countries (same type used in DemographicCard)
type CountryType = "Uganda" | "Kenya" | "Rwanda";

// Updated component props to include `country`
interface CountryMapProps {
  mapColor?: string;
  country: CountryType; // 👈 Add this so DemographicCard doesn't error
}

const CountryMap: React.FC<CountryMapProps> = ({ mapColor, country }) => {
  // Map country names to region codes
  const countryToRegion = {
    Uganda: "UG",
    Kenya: "KE",
    Rwanda: "RW",
  };

  return (
    <VectorMap
      map={worldMill}
      backgroundColor="transparent"
      markerStyle={{
        initial: {
          fill: "#465FFF",
          r: 4,
        } as never,
      }}
      markersSelectable={true}
      markers={[
        {
          latLng: [1.3733, 32.2903],
          name: "Uganda",
          style: {
            fill: "#465FFF",
            borderWidth: 1,
            borderColor: "white",
            stroke: "#383f47",
          },
        },
        {
          latLng: [-6.3690, 34.8888],
          name: "Tanzania",
          style: { fill: "#465FFF", borderWidth: 1, borderColor: "white" },
        },
        {
          latLng: [-0.0236, 37.9062],
          name: "Kenya",
          style: {
            fill: "#465FFF",
            borderWidth: 1,
            borderColor: "white",
            strokeOpacity: 0,
          },
        },
        {
          latLng: [-1.9403, 29.8739],
          name: "Rwanda", // 👈 Add marker if needed
          style: {
            fill: "#465FFF",
            borderWidth: 1,
            borderColor: "white",
            strokeOpacity: 0,
          },
        },
      ]}
      zoomOnScroll={false}
      zoomMax={12}
      zoomMin={1}
      zoomAnimate={true}
      zoomStep={1.5}
      regionStyle={{
        initial: {
          fill: mapColor || "#D0D5DD",
          fillOpacity: 1,
          fontFamily: "Outfit",
          stroke: "none",
          strokeWidth: 0,
          strokeOpacity: 0,
        },
        hover: {
          fillOpacity: 0.7,
          cursor: "pointer",
          fill: "#465fff",
          stroke: "none",
        },
        selected: {
          fill: "#465FFF",
        },
        selectedHover: {},
      }}
      regionLabelStyle={{
        initial: {
          fill: "#35373e",
          fontWeight: 500,
          fontSize: "13px",
          stroke: "none",
        },
        hover: {},
        selected: {},
        selectedHover: {},
      }}
      selectedRegions={[countryToRegion[country]]}
    />
  );
};

export default CountryMap;
