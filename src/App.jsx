import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button,
  Switch,
  FormControlLabel,
  TextField,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Checkbox,
  ListItemIcon,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { FaFilter } from "react-icons/fa";

const ResourceGroups = () => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [resourceGroups, setResourceGroups] = useState([]);
  const [filteredGroups, setFilteredGroups] = useState([]);
  const [costData, setCostData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [subscriptionIdsDialogOpen, setSubscriptionIdsDialogOpen] =
    useState(false);
  const [namesDialogOpen, setNamesDialogOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [subscriptionIds, setSubscriptionIds] = useState([]);
  const [names, setNames] = useState([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState(null);
  const [selectedName, setSelectedName] = useState(null);
  const [showCostData, setShowCostData] = useState(false);
  const [sortConfig, setSortConfig] = useState(null);
  const [filterName, setFilterName] = useState("");
  const [selectedNames, setSelectedNames] = useState([]);
  const [createdFilters, setCreatedFilters] = useState([]);
  const [totalCost, setTotalCost] = useState(0);

  useEffect(() => {
    const fetchResourceGroups = async () => {
      try {
        const response = await axios.get(
          "http://localhost:5001/api/resource-groups"
        );
        const formattedData = response.data.flatMap((subscription) =>
          subscription.ResourceGroups.map((rg) => ({
            SubscriptionId: subscription.SubscriptionId,
            ...rg,
          }))
        );
        setResourceGroups(formattedData);

        const uniqueSubscriptionIds = [
          ...new Set(formattedData.map((group) => group.SubscriptionId)),
        ];
        setSubscriptionIds(uniqueSubscriptionIds);

        // Fetch saved filters
        const filtersResponse = await axios.get(
          "http://localhost:3000/filters"
        );
        setCreatedFilters(filtersResponse.data);
      } catch (error) {
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchResourceGroups();
  }, []);

  const handleSubscriptionIdSelect = (subscriptionId) => {
    setSelectedSubscriptionId(subscriptionId);
    const selectedGroups = resourceGroups.filter(
      (group) => group.SubscriptionId === subscriptionId
    );
    const uniqueNames = [...new Set(selectedGroups.map((group) => group.Name))];
    setNames(uniqueNames);
    setSubscriptionIdsDialogOpen(false);
  };

  const handleNameSelect = async (name) => {
    setSelectedName(name);
    setLoading(true);
    setNamesDialogOpen(false);
    try {
      const selectedGroup = resourceGroups
        .filter((group) => group.SubscriptionId === selectedSubscriptionId)
        .find((group) => group.Name === name);

      if (selectedGroup) {
        const { SubscriptionId } = selectedGroup;
        setFilteredGroups([selectedGroup]);

        const response = await axios.get(
          `http://localhost:5001/api/resource-cost?startDate=${startDate}&endDate=${endDate}&resourceGroupName=${name}&subscriptionId=${SubscriptionId}`
        );
        setCostData(response.data);
      } else {
        setError("No matching resource group found");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showCostData && costData.length > 0) {
      const sum = costData.reduce(
        (acc, item) => acc + (parseFloat(item.totalCost) || 0),
        0
      );
      setTotalCost(sum);
    } else {
      setTotalCost(0);
    }
  }, [costData, showCostData]);

  const toggleShowCostData = () => {
    setShowCostData(!showCostData);
  };

  const openSubscriptionIdsDialog = () => {
    setSubscriptionIdsDialogOpen(true);
  };

  const openNamesDialog = () => {
    setNamesDialogOpen(true);
  };

  const closeSubscriptionIdsDialog = () => {
    setSubscriptionIdsDialogOpen(false);
  };

  const closeNamesDialog = () => {
    setNamesDialogOpen(false);
  };

  const openFilterDialog = () => {
    setFilterDialogOpen(true);
  };

  const closeFilterDialog = () => {
    setFilterDialogOpen(false);
  };
  const convertDateToISO = (date) => {
    if (!date) return "";
    const [day, month, year] = date.split("-");
    return `${year}-${month}-${day}`;
  };

  // Check if date is in yyyy-mm-dd format and is valid
  const isValidDate = (date) => {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(date)) return false;

    const parsedDate = new Date(date);
    return parsedDate.toISOString().slice(0, 10) === date;
  };

  // Handle start date change
  const handleStartDateChange = (e) => {
    const formattedDate = e.target.value;
    setStartDate(formattedDate);
  };

  // Handle end date change
  const handleEndDateChange = (e) => {
    const formattedDate = e.target.value;
    setEndDate(formattedDate);
  };

  // Validate and process dates
  const validateDates = () => {
    if (
      typeof startDate === "string" &&
      startDate.trim() !== "" &&
      typeof endDate === "string" &&
      endDate.trim() !== ""
    ) {
      if (isValidDate(startDate) && isValidDate(endDate)) {
        // Process valid dates here
        setError("");
        console.log("Valid Dates:", { startDate, endDate });
      } else {
        setError("Invalid date format. Please use yyyy-mm-dd.");
      }
    } else {
      setError("Dates cannot be empty.");
    }
  };

  const handleCreateFilter = async () => {
    try {
      await axios.post("http://localhost:3000/filters", {
        name: filterName,
        subscriptionId: selectedSubscriptionId,
        names: selectedNames,
      });
      // Refresh filters list
      const filtersResponse = await axios.get("http://localhost:3000/filters");
      setCreatedFilters(filtersResponse.data);
      setFilterName("");
      setSelectedNames([]);
      closeFilterDialog();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleSaveEditedFilter = async () => {
    try {
      await axios.patch(`http://localhost:3000/filters/${editingFilter.id}`, {
        name: filterName,
        subscriptionId: selectedSubscriptionId,
        names: selectedNames,
      });

      // Refresh the filters list
      const filtersResponse = await axios.get("http://localhost:3000/filters");
      setCreatedFilters(filtersResponse.data);

      // Clear state and close dialog
      setFilterName("");
      setSelectedNames([]);
      setEditingFilter(null);
      closeFilterDialog();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteFilter = async (id) => {
    try {
      await axios.delete(`http://localhost:3000/filters/${id}`);
      const filtersResponse = await axios.get("http://localhost:3000/filters");
      setCreatedFilters(filtersResponse.data);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFilterSelect = async (filter) => {
    setLoading(true);
    try {
      const { subscriptionId, names } = filter;
      setSelectedSubscriptionId(subscriptionId);
      setSelectedNames(names);

      const selectedGroups = resourceGroups.filter(
        (group) =>
          group.SubscriptionId === subscriptionId && names.includes(group.Name)
      );
      setFilteredGroups(selectedGroups);

      const response = await axios.get(
        `http://localhost:5001/api/resource-cost?startDate=${startDate}&endDate=${endDate}&resourceGroupName=${names.join(
          ","
        )}&subscriptionId=${subscriptionId}`
      );
      setCostData(response.data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const sortData = (key) => {
    let sortedData;
    if (showCostData) {
      sortedData = [...costData];
    } else {
      sortedData = [...filteredGroups];
    }

    if (sortConfig?.key === key && sortConfig.direction === "ascending") {
      sortedData.sort((a, b) => {
        if (key === "CreatedTime") {
          return new Date(b[key]) - new Date(a[key]); // New to Old
        } else if (key === "TotalCost") {
          return b[key] - a[key]; // Big to Small
        } else {
          return a[key] < b[key] ? 1 : -1; // Default sorting
        }
      });
      setSortConfig({ key, direction: "descending" });
    } else {
      sortedData.sort((a, b) => {
        if (key === "CreatedTime") {
          return new Date(a[key]) - new Date(b[key]); // Old to New
        } else if (key === "TotalCost") {
          return a[key] - b[key]; // Small to Big
        } else {
          return a[key] > b[key] ? 1 : -1; // Default sorting
        }
      });
      setSortConfig({ key, direction: "ascending" });
    }

    if (showCostData) {
      setCostData(sortedData);
    } else {
      setFilteredGroups(sortedData);
    }
  };

  const columns = [
    { field: "id", headerName: "ID", width: 150 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "type", headerName: "Type", width: 150 },
    { field: "location", headerName: "Location", width: 150 },
    { field: "createdBy", headerName: "Created By", width: 200 },
    { field: "createdTime", headerName: "Created Time", width: 200 },
    {
      field: "resourceGroupName",
      headerName: "Resource Group Name",
      width: 200,
    },
    ...(showCostData
      ? [
          { field: "totalCost", headerName: "Total Cost", width: 150 },
          { field: "currency", headerName: "Currency", width: 150 },
        ]
      : []),
  ];

  // Function to conditionally filter cost data
  const getFilteredCostData = (data) => {
    if (showCostData) {
      // If showing cost data, return it as is
      return data;
    } else {
      // If not showing cost data, remove the fields
      return data.map(({ totalCost, currency, ...rest }) => rest);
    }
  };

  // Determine which data to display
  const rows = getFilteredCostData(costData);
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div>
      <h1>Resource Groups</h1>

      <div className="main">
        <div className="date-container">
          <label>Start Date:</label>
          <input
            type="date"
            placeholder="Start Date"
            value={startDate} // Reformatting to yyyy-mm-dd for input display
            onChange={handleStartDateChange}
          />
          <label>End Date:</label>
          <input
            type="date"
            placeholder="End Date"
            value={endDate} // Reformatting to yyyy-mm-dd for input display
            onChange={handleEndDateChange}
          />
        </div>

        <Button
          className="button"
          variant="outlined"
          onClick={openSubscriptionIdsDialog}
        >
          {selectedSubscriptionId
            ? `${selectedSubscriptionId}`
            : "Select Subscription ID"}
        </Button>
        <div className="main-2">
          <Button
            className="button"
            variant="outlined"
            onClick={openNamesDialog}
            disabled={!selectedSubscriptionId}
          >
            {selectedName ? `${selectedName}` : "Select Name"}
          </Button>
          <Button variant="outlined" onClick={openFilterDialog}>
            <FaFilter />
          </Button>
          <FormControlLabel
            control={
              <Switch checked={showCostData} onChange={toggleShowCostData} />
            }
            label="Show Cost Data"
          />

          <div style={{ marginTop: "16px", fontWeight: "bold" }}>
            Total Cost: {totalCost} {costData[0]?.currency || ""}
          </div>
        </div>

        <Dialog
          open={subscriptionIdsDialogOpen}
          onClose={closeSubscriptionIdsDialog}
        >
          <DialogTitle>Select a Subscription ID</DialogTitle>
          <List>
            {subscriptionIds.map((subscriptionId, index) => (
              <ListItem
                button
                onClick={() => handleSubscriptionIdSelect(subscriptionId)}
                key={index}
              >
                <ListItemText primary={subscriptionId} />
              </ListItem>
            ))}
          </List>
        </Dialog>

        <Dialog open={namesDialogOpen} onClose={closeNamesDialog}>
          <DialogTitle>Select a Name</DialogTitle>
          <List>
            <Select
              onChange={(e) => handleFilterSelect(e.target.value)}
              defaultValue=""
            >
              <MenuItem value="" disabled>
                Select a Filter
              </MenuItem>
              {createdFilters.map((filter) => (
                <MenuItem key={filter.id} value={filter}>
                  {filter.name}
                </MenuItem>
              ))}
            </Select>
            {names.map((name, index) => (
              <ListItem
                button
                onClick={() => handleNameSelect(name)}
                key={index}
              >
                <ListItemText primary={name} />
              </ListItem>
            ))}
          </List>
        </Dialog>
      </div>

      <Dialog open={filterDialogOpen} onClose={closeFilterDialog}>
        <DialogTitle>Create or Select a Filter</DialogTitle>
        <DialogContent>
          <TextField
            label="Filter Name"
            fullWidth
            value={filterName}
            onChange={(e) => setFilterName(e.target.value)}
            margin="normal"
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Subscription ID</InputLabel>
            <Select
              value={selectedSubscriptionId || ""}
              onChange={(e) => handleSubscriptionIdSelect(e.target.value)}
            >
              {subscriptionIds.map((subscriptionId) => (
                <MenuItem key={subscriptionId} value={subscriptionId}>
                  {subscriptionId}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Select Names</InputLabel>
            <Select
              multiple
              value={selectedNames}
              onChange={(e) => setSelectedNames(e.target.value)}
              renderValue={(selected) => selected.join(", ")}
            >
              {names.map((name) => (
                <MenuItem key={name} value={name}>
                  <Checkbox checked={selectedNames.indexOf(name) > -1} />
                  <ListItemText primary={name} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <Button onClick={handleCreateFilter}>Save Filter</Button>
          </FormControl>
          {createdFilters.map((filter) => (
            <div key={filter.id} className="filter-table-container">
              <table className="filter-table" key={filter.id}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Subscription ID</th>
                    <th>Names</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="name">{filter.name}</td>
                    <td className="subscriptionId">{filter.subscriptionId}</td>
                    <td className="names">{filter.names.join(", ")}</td>
                    <td className="actions">
                      <button
                        className="edit"
                        onClick={() => handleEditFilter(filter)}
                      >
                        Edit
                      </button>
                      <button
                        className="delete"
                        onClick={() => handleDeleteFilter(filter.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          ))}

          <FormControl fullWidth margin="normal">
            <InputLabel>Select Filter</InputLabel>
            <Select
              onChange={(e) => handleFilterSelect(e.target.value)}
              defaultValue=""
            >
              <MenuItem value="" disabled>
                Select a Filter
              </MenuItem>
              {createdFilters.map((filter) => (
                <MenuItem key={filter.id} value={filter}>
                  {filter.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeFilterDialog}>Cancel</Button>
        </DialogActions>
      </Dialog>

      <div style={{ height: 500, width: "100%" }}>
        <DataGrid rows={rows} columns={columns} pageSize={10} />
      </div>
    </div>
  );
};

export default ResourceGroups;
