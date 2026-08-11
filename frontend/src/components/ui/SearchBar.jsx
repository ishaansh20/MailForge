import { Input } from "./Input.jsx";
import { Icon } from "./Icon.jsx";

function SearchBar({ placeholder = "Search", ...props }) {
  return (
    <Input
      leftIcon={<Icon name="search" size={16} />}
      placeholder={placeholder}
      {...props}
    />
  );
}

export { SearchBar };
