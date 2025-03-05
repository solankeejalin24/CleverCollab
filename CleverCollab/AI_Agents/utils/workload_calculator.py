def calculate_workload(employee):
    return sum(float(t["Estimated Hours"]) for t in employee.current_tasks)
