import React from "react";
import InternProfilePage from "../../pm/InternProfilePage";
import { hrApi } from "../../../lib/apiClient";

export default function HrInternProfilePage(props) {
  return <InternProfilePage {...props} api={hrApi} />;
}
