'use client';

import React from "react";
import { Button } from "../shared/Button";

export interface RatingControlsProps {
  onSelect?: (rating: "forgot" | "hard" | "good" | "easy") => void;
}

export const RatingControls: React.FC<RatingControlsProps> = ({ onSelect }) => (
  <div className="flex gap-2 flex-wrap">
    <Button variant="secondary" onClick={() => onSelect?.("forgot")}>
      Forgot
    </Button>
    <Button variant="secondary" onClick={() => onSelect?.("hard")}>
      Hard
    </Button>
    <Button variant="secondary" onClick={() => onSelect?.("good")}>
      Good
    </Button>
    <Button variant="secondary" onClick={() => onSelect?.("easy")}>
      Easy
    </Button>
  </div>
);
