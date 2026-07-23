export const getStrandedTrains = async () => {
  try {
    const response = await fetch("/api/stranded-trains");

    if (response.status === 401) {
      return {
        unauthorized: true,
        data: [],
      };
    }

    if (!response.ok) {
      throw new Error("Failed to fetch stranded trains");
    }

    return {
      unauthorized: false,
      data: await response.json(),
    };
  } catch (error) {
    console.error(error);

    return {
      unauthorized: false,
      data: [],
    };
  }
};

export const getStrandedTrainById = async (id) => {
  try {
    const response = await fetch(`/api/stranded-trains/${id}`);

    if (response.status === 401) {
      return {
        unauthorized: true,
        data: null,
      };
    }

    if (!response.ok) {
      throw new Error("Failed to fetch train");
    }

    return {
      unauthorized: false,
      data: await response.json(),
    };
  } catch (error) {
    console.error(error);

    return {
      unauthorized: false,
      data: null,
    };
  }
};

export const saveStrandedTrain = async (mode, id, data) => {
  const url =
    mode === "new" ? "/api/stranded-trains" : `/api/stranded-trains/${id}`;

  const method = mode === "new" ? "POST" : "PUT";

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    return {
      success: response.ok,
      result,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      result: {
        error: "Failed to save stranded train",
      },
    };
  }
};

export const deleteStrandedTrain = async (id) => {
  try {
    const response = await fetch(`/api/stranded-trains/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deleted: true,
      }),
    });

    const result = await response.json();

    return {
      success: response.ok,
      result,
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      result: {
        error: "Failed to delete train",
      },
    };
  }
};

const strandedTrainsService = {
  getStrandedTrains,
  getStrandedTrainById,
  saveStrandedTrain,
  deleteStrandedTrain,
};

export default strandedTrainsService;
